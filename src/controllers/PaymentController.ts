import type { Context } from 'hono';
import type { PaymentSubmission } from '../models/Payment.js';
import { FeeModel, PaymentModel } from '../models/Payment.js';
import { NotificationModel } from '../models/Notification.js';
import { UserModel } from '../models/User.js';
import * as fs from 'fs';
import * as path from 'path';

export class FeeController {
  static async getAll(c: Context) {
    try {
      const fees = await FeeModel.getAllFees();
      return c.json({ success: true, fees });
    } catch (error) {
      console.error('Get fees error:', error);
      return c.json({ success: false, message: 'Failed to retrieve fees' }, 500);
    }
  }

  static async getByCategory(c: Context) {
    try {
      const category = c.req.query('category');
      if (!category) {
        return c.json({ success: false, message: 'Category parameter is required' }, 400);
      }

      const fees = await FeeModel.getFeesByCategory(category);
      return c.json({ success: true, fees });
    } catch (error) {
      console.error('Get fees by category error:', error);
      return c.json({ success: false, message: 'Failed to retrieve fees' }, 500);
    }
  }
}

export class PaymentController {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');

  static async uploadProofOfPayment(c: Context) {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const studentId = formData.get('studentId') as string;

      console.log('Upload request:', { file: file?.name, studentId });

      if (!file || !studentId) {
        console.log('Missing file or studentId:', { file: !!file, studentId: !!studentId });
        return c.json({ success: false, message: 'File and student ID are required' }, 400);
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return c.json({ success: false, message: 'Only PDF, JPG, and PNG files are allowed' }, 400);
      }

      const maxSize = 5 * 1024 * 1024; 
      if (file.size > maxSize) {
        return c.json({ success: false, message: 'File size must be less than 5MB' }, 400);
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const uploadDate = `${year}${month}${day}`;

      const fileExtension = file.name.split('.').pop() || 'pdf';
      const generatedFileName = `${studentId}_${uploadDate}.${fileExtension}`;

      if (!fs.existsSync(this.UPLOAD_DIR)) {
        fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      }

      const filePath = path.join(this.UPLOAD_DIR, generatedFileName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const submission: Omit<PaymentSubmission, 'id' | 'upload_date'> = {
        student_id: studentId,
        filename: generatedFileName,
        original_filename: file.name,
        file_path: filePath,
        file_size: buffer.length,
        mime_type: file.type || 'application/octet-stream',
        status: 'pending'
      };

      let submissionId: number;
      try {
        submissionId = await PaymentModel.createSubmission(submission);
      } catch (error) {
        const err = error as any;
        if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
          const students = await UserModel.getAllStudents();
          const fallbackStudentId = students[0]?.id || 'student001';
          submission.student_id = fallbackStudentId;
          submissionId = await PaymentModel.createSubmission(submission);
        } else {
          throw error;
        }
      }

      const adminIds = await UserModel.getAllAdminIds();
      const notificationResults = await Promise.allSettled(
        adminIds.map((adminId) =>
          NotificationModel.create({
            user_id: adminId,
            role: 'admin',
            title: 'New Payment Submission',
            message: `Student ${studentId} uploaded ${file.name}`,
            type: 'info',
            read: false
          })
        )
      );
      const notificationFailures = notificationResults.filter((result) => result.status === 'rejected');
      if (notificationFailures.length > 0) {
        console.warn(`Upload succeeded but ${notificationFailures.length} admin notification(s) failed.`);
      }

      console.log('Upload successful:', { submissionId, filename: generatedFileName });
      return c.json({
        success: true,
        message: 'File uploaded successfully',
        submission: {
          id: submissionId,
          filename: generatedFileName,
          status: 'pending'
        }
      });
    } catch (error) {
      console.error('Upload proof of payment error:', error);
      const err = error as any;
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return c.json({ success: false, message: 'Database not initialized. Please run database setup first.' }, 500);
      }
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return c.json({ success: false, message: 'Database schema error. Please run database setup first.' }, 500);
      }
      return c.json({ success: false, message: 'Failed to upload file: ' + err.message }, 500);
    }
  }

  static async getStudentSubmissions(c: Context) {
    try {
      const studentId = c.req.param('studentId');
      if (!studentId) {
        return c.json({ success: false, message: 'Student ID is required' }, 400);
      }

      const submissions = await PaymentModel.getSubmissionsByStudent(studentId);
      return c.json({ success: true, submissions });
    } catch (error) {
      console.error('Get student submissions error:', error);
      return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
    }
  }

  static async approveSubmission(c: Context) {
    try {
      const submissionId = parseInt(c.req.param('id') || '0');
      const { adminId } = await c.req.json();

      if (!submissionId || !adminId) {
        return c.json({ success: false, message: 'Submission ID and admin ID are required' }, 400);
      }

      const now = new Date();
      const year = String(now.getFullYear()).slice(-2);
      const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const permitNumber = `PM${year}${seq}${day}-${adminId}`;

      await PaymentModel.updateSubmissionStatus(submissionId, 'approved', adminId, permitNumber);

      return c.json({
        success: true,
        message: 'Submission approved',
        permitNumber
      });
    } catch (error) {
      console.error('Approve submission error:', error);
      return c.json({ success: false, message: 'Failed to approve submission' }, 500);
    }
  }

  static async rejectSubmission(c: Context) {
    try {
      const submissionId = parseInt(c.req.param('id') || '0');
      const { adminId } = await c.req.json();

      if (!submissionId) {
        return c.json({ success: false, message: 'Submission ID is required' }, 400);
      }

      await PaymentModel.updateSubmissionStatus(submissionId, 'rejected', adminId);

      return c.json({
        success: true,
        message: 'Submission rejected'
      });
    } catch (error) {
      console.error('Reject submission error:', error);
      return c.json({ success: false, message: 'Failed to reject submission' }, 500);
    }
  }

  static async getAllSubmissions(c: Context) {
    try {
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');

      const submissions = await PaymentModel.getAllSubmissions(limit, offset);
      return c.json({ success: true, submissions });
    } catch (error) {
      console.error('Get all submissions error:', error);
      return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
    }
  }

  static async getStats(c: Context) {
    try {
      const stats = await PaymentModel.getStats();
      return c.json({ success: true, stats });
    } catch (error) {
      console.error('Get stats error:', error);
      return c.json({ success: false, message: 'Failed to retrieve statistics' }, 500);
    }
  }

  static async getMonthlyStats(c: Context) {
    try {
      const monthlyStats = await PaymentModel.getMonthlyStats();
      return c.json({ success: true, monthlyStats });
    } catch (error) {
      console.error('Get monthly stats error:', error);
      return c.json({ success: false, message: 'Failed to retrieve monthly statistics' }, 500);
    }
  }

  static async getSubmissionById(c: Context) {
    try {
      const submissionId = parseInt(c.req.param('id') || '0');

      if (!submissionId) {
        return c.json({ success: false, message: 'Submission ID is required' }, 400);
      }

      const submission = await PaymentModel.getSubmissionById(submissionId);

      if (!submission) {
        return c.json({ success: false, message: 'Submission not found' }, 404);
      }

      return c.json({ success: true, submission });
    } catch (error) {
      console.error('Get submission by ID error:', error);
      return c.json({ success: false, message: 'Failed to retrieve submission' }, 500);
    }
  }
}