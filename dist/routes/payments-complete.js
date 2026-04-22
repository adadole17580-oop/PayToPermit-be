import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { PaymentModel } from '../models/Payment.js';
import { createNotification } from './notifications-complete.js';
const paymentRoutes = new Hono();
// Enhanced file upload with comprehensive validation
paymentRoutes.post('/upload', async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file');
        const studentId = formData.get('studentId');
        console.log('📤 Upload request:', { file: file?.name, studentId, size: file?.size });
        // Comprehensive validation
        if (!file) {
            return c.json({ success: false, message: 'No file provided' }, 400);
        }
        if (!studentId || studentId.trim().length < 3) {
            return c.json({ success: false, message: 'Valid student ID is required' }, 400);
        }
        // File type validation
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({
                success: false,
                message: 'Only PDF, JPG, and PNG files are allowed',
                allowedTypes: allowedTypes
            }, 400);
        }
        // File size validation (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return c.json({
                success: false,
                message: 'File size must be less than 5MB',
                maxSize: '5MB',
                currentSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
            }, 400);
        }
        // File name validation
        if (file.name.length > 255) {
            return c.json({ success: false, message: 'File name is too long' }, 400);
        }
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('📁 Created uploads directory');
        }
        // Generate unique filename
        const now = new Date();
        const timestamp = now.getTime();
        const fileExtension = file.name.split('.').pop() || 'pdf';
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const generatedFileName = `${studentId}_${timestamp}_${sanitizedName}`;
        const filePath = path.join(uploadDir, generatedFileName);
        // Save file to disk
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
        // Create submission record in database
        const submissionId = await PaymentModel.createSubmission({
            student_id: studentId,
            filename: generatedFileName,
            original_filename: file.name,
            file_path: filePath,
            file_size: buffer.length,
            mime_type: file.type,
            status: 'pending'
        });
        // Notify all admins about the new submission
        // In a real system, you'd query the database for all admin IDs
        const adminIds = ['admin001', 'admin002']; // Mock admin IDs
        adminIds.forEach(adminId => {
            createNotification(adminId, 'admin', 'New Payment Submission', `Student ${studentId} has uploaded a payment receipt: ${file.name}`, 'payment_submission');
        });
        console.log(`✅ Upload successful: ${generatedFileName} (${buffer.length} bytes)`);
        console.log(`📢 Notifications sent to ${adminIds.length} admins`);
        return c.json({
            success: true,
            message: 'File uploaded successfully and is pending approval',
            submission: {
                id: submissionId,
                filename: generatedFileName,
                original_filename: file.name,
                status: 'pending',
                upload_date: now.toISOString(),
                file_size: buffer.length
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        return c.json({
            success: false,
            message: 'Upload failed due to server error: ' + error.message
        }, 500);
    }
});
// Get student submissions with filtering
paymentRoutes.get('/student/:studentId', async (c) => {
    try {
        const studentId = c.req.param('studentId');
        if (!studentId) {
            return c.json({ success: false, message: 'Student ID is required' }, 400);
        }
        const submissions = await PaymentModel.getSubmissionsByStudent(studentId);
        return c.json({
            success: true,
            submissions: submissions.map(s => ({
                id: s.id,
                original_filename: s.original_filename,
                permit_number: s.permit_number || '-',
                status: s.status,
                file_size: s.file_size
            })),
            pagination: {
                page: 1,
                limit: submissions.length,
                total: submissions.length,
                pages: 1
            }
        });
    }
    catch (error) {
        console.error('Get submissions error:', error);
        return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
    }
});
// Get all submissions for admin
paymentRoutes.get('/all', async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');
        const submissions = await PaymentModel.getAllSubmissions(limit, offset);
        return c.json({
            success: true,
            submissions: submissions.map(s => ({
                submission_id: s.id,
                student_id: s.student_id,
                original_filename: s.original_filename,
                upload_date: s.upload_date.toISOString(),
                status: s.status,
                permit_number: s.permit_number,
                admin_id: s.admin_id,
                file_size: s.file_size
            })),
            pagination: {
                page: Math.floor(offset / limit) + 1,
                limit,
                total: submissions.length, // This should be improved to get total count
                pages: Math.ceil(submissions.length / limit)
            }
        });
    }
    catch (error) {
        console.error('Get all submissions error:', error);
        return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
    }
});
// Get comprehensive statistics
paymentRoutes.get('/stats', async (c) => {
    try {
        const stats = await PaymentModel.getStats();
        // Calculate file size statistics (this would need to be added to PaymentModel)
        const totalSize = 0; // Placeholder - would need to query database
        const avgSize = stats.total > 0 ? totalSize / stats.total : 0;
        // Recent submissions (last 7 days) - placeholder
        const recentSubmissions = 0; // Would need to query database
        return c.json({
            success: true,
            stats: {
                total: stats.total,
                approved: stats.approved,
                rejected: stats.rejected,
                pending: stats.pending,
                approval_rate: stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0,
                total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
                avg_size_mb: (avgSize / 1024 / 1024).toFixed(2),
                recent_submissions: recentSubmissions
            }
        });
    }
    catch (error) {
        console.error('Get stats error:', error);
        return c.json({ success: false, message: 'Failed to retrieve statistics' }, 500);
    }
});
// Get monthly statistics
paymentRoutes.get('/monthly-stats', async (c) => {
    try {
        const monthlyStats = await PaymentModel.getMonthlyStats();
        return c.json({ success: true, monthlyStats });
    }
    catch (error) {
        console.error('Get monthly stats error:', error);
        return c.json({ success: false, message: 'Failed to retrieve monthly statistics' }, 500);
    }
});
// Get submission by ID
paymentRoutes.get('/:id', async (c) => {
    try {
        const submissionId = parseInt(c.req.param('id') || '0');
        if (!submissionId) {
            return c.json({ success: false, message: 'Submission ID is required' }, 400);
        }
        const submission = await PaymentModel.getSubmissionById(submissionId);
        if (!submission) {
            return c.json({ success: false, message: 'Submission not found' }, 404);
        }
        return c.json({
            success: true,
            submission: {
                id: submission.id,
                student_id: submission.student_id,
                original_filename: submission.original_filename,
                upload_date: submission.upload_date.toISOString(),
                status: submission.status,
                permit_number: submission.permit_number,
                admin_id: submission.admin_id,
                file_size: submission.file_size,
                file_size_mb: (submission.file_size / 1024 / 1024).toFixed(2),
                upload_date_formatted: submission.upload_date.toLocaleString()
            }
        });
    }
    catch (error) {
        console.error('Get submission by ID error:', error);
        return c.json({ success: false, message: 'Failed to retrieve submission' }, 500);
    }
});
// Approve submission
paymentRoutes.put('/:id/approve', async (c) => {
    try {
        const submissionId = parseInt(c.req.param('id') || '0');
        const { adminId, notes } = await c.req.json();
        if (!submissionId) {
            return c.json({ success: false, message: 'Submission ID is required' }, 400);
        }
        // Check if submission exists and is pending
        const existingSubmission = await PaymentModel.getSubmissionById(submissionId);
        if (!existingSubmission) {
            return c.json({ success: false, message: 'Submission not found' }, 404);
        }
        if (existingSubmission.status !== 'pending') {
            return c.json({ success: false, message: 'Submission has already been processed' }, 400);
        }
        // Generate permit number
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2);
        const seq = String(submissionId).padStart(4, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const permitNumber = `PM${year}${seq}${day}`;
        // Update submission status in database
        const success = await PaymentModel.updateSubmissionStatus(submissionId, 'approved', adminId, permitNumber);
        if (!success) {
            return c.json({ success: false, message: 'Failed to update submission' }, 500);
        }
        // Notify the student about approval
        createNotification(existingSubmission.student_id, 'student', 'Payment Approved', `Your payment submission has been approved. Permit Number: ${permitNumber}`, 'payment_approved');
        console.log(`✅ Submission approved: ${submissionId} -> ${permitNumber}`);
        console.log(`📢 Notification sent to student ${existingSubmission.student_id}`);
        return c.json({
            success: true,
            message: 'Submission approved successfully',
            permitNumber,
            submission: {
                id: submissionId,
                status: 'approved',
                permit_number: permitNumber
            }
        });
    }
    catch (error) {
        console.error('Approve submission error:', error);
        return c.json({ success: false, message: 'Failed to approve submission' }, 500);
    }
});
// Reject submission
paymentRoutes.put('/:id/reject', async (c) => {
    try {
        const submissionId = parseInt(c.req.param('id') || '0');
        const { adminId, reason } = await c.req.json();
        if (!submissionId) {
            return c.json({ success: false, message: 'Submission ID is required' }, 400);
        }
        // Check if submission exists and is pending
        const existingSubmission = await PaymentModel.getSubmissionById(submissionId);
        if (!existingSubmission) {
            return c.json({ success: false, message: 'Submission not found' }, 404);
        }
        if (existingSubmission.status !== 'pending') {
            return c.json({ success: false, message: 'Submission has already been processed' }, 400);
        }
        // Update submission status in database
        const success = await PaymentModel.updateSubmissionStatus(submissionId, 'rejected', adminId, null, reason);
        if (!success) {
            return c.json({ success: false, message: 'Failed to update submission' }, 500);
        }
        // Notify the student about rejection
        createNotification(existingSubmission.student_id, 'student', 'Payment Rejected', `Your payment submission has been rejected. Reason: ${reason}`, 'payment_rejected');
        console.log(`❌ Submission rejected: ${submissionId} - ${reason}`);
        console.log(`📢 Notification sent to student ${existingSubmission.student_id}`);
        return c.json({
            success: true,
            message: 'Submission rejected successfully',
            submission: {
                id: submissionId,
                status: 'rejected',
                rejection_reason: reason
            }
        });
    }
    catch (error) {
        console.error('Reject submission error:', error);
        return c.json({ success: false, message: 'Failed to reject submission' }, 500);
    }
});
export default paymentRoutes;
