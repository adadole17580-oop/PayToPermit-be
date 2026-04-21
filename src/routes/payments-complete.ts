import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';

// Complete in-memory payment system - no database required
let submissions: any[] = [];
let submissionIdCounter = 1;

const paymentRoutes = new Hono();

// Enhanced file upload with comprehensive validation
paymentRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;

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

    // Create submission record
    const submission = {
      submission_id: submissionIdCounter++,
      student_id: studentId,
      filename: generatedFileName,
      original_filename: file.name,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type,
      status: 'pending',
      upload_date: now.toISOString(),
      permit_number: null,
      admin_id: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    submissions.push(submission);

    console.log(`✅ Upload successful: ${generatedFileName} (${buffer.length} bytes)`);

    return c.json({
      success: true,
      message: 'File uploaded successfully and is pending approval',
      submission: {
        id: submission.submission_id,
        filename: generatedFileName,
        original_filename: file.name,
        status: 'pending',
        upload_date: submission.upload_date,
        file_size: buffer.length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      success: false, 
      message: 'Upload failed due to server error: ' + (error as Error).message 
    }, 500);
  }
});

// Get student submissions with filtering
paymentRoutes.get('/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '10');
    const page = parseInt(c.req.query('page') || '1');

    if (!studentId) {
      return c.json({ success: false, message: 'Student ID is required' }, 400);
    }

    let studentSubmissions = submissions.filter(s => s.student_id === studentId);

    // Filter by status if provided
    if (status) {
      studentSubmissions = studentSubmissions.filter(s => s.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedSubmissions = studentSubmissions.slice(startIndex, startIndex + limit);

    return c.json({ 
      success: true, 
      submissions: paginatedSubmissions.map(s => ({
        ...s,
        permit_number: s.permit_number || '-',
        id: s.submission_id,
        file_size_mb: (s.file_size / 1024 / 1024).toFixed(2)
      })),
      pagination: {
        page,
        limit,
        total: studentSubmissions.length,
        pages: Math.ceil(studentSubmissions.length / limit)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
  }
});

// Get all submissions for admin
paymentRoutes.get('/all', async (c) => {
  try {
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '20');
    const page = parseInt(c.req.query('page') || '1');

    let allSubmissions = [...submissions];

    // Filter by status if provided
    if (status) {
      allSubmissions = allSubmissions.filter(s => s.status === status);
    }

    // Sort by upload date (newest first)
    allSubmissions.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedSubmissions = allSubmissions.slice(startIndex, startIndex + limit);

    return c.json({ 
      success: true, 
      submissions: paginatedSubmissions.map(s => ({
        ...s,
        id: s.submission_id,
        file_size_mb: (s.file_size / 1024 / 1024).toFixed(2),
        upload_date_formatted: new Date(s.upload_date).toLocaleString()
      })),
      pagination: {
        page,
        limit,
        total: allSubmissions.length,
        pages: Math.ceil(allSubmissions.length / limit)
      }
    });
  } catch (error) {
    console.error('Get all submissions error:', error);
    return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
  }
});

// Get comprehensive statistics
paymentRoutes.get('/stats', async (c) => {
  try {
    const total = submissions.length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const pending = submissions.filter(s => s.status === 'pending').length;

    // Calculate file size statistics
    const totalSize = submissions.reduce((sum, s) => sum + s.file_size, 0);
    const avgSize = total > 0 ? totalSize / total : 0;

    // Recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSubmissions = submissions.filter(s => new Date(s.upload_date) > sevenDaysAgo);

    return c.json({ 
      success: true, 
      stats: {
        total,
        approved,
        rejected,
        pending,
        approval_rate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
        total_size_mb: (totalSize / 1024 / 1024).toFixed(2),
        avg_size_mb: (avgSize / 1024 / 1024).toFixed(2),
        recent_submissions: recentSubmissions.length
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ success: false, message: 'Failed to retrieve statistics' }, 500);
  }
});

// Get monthly statistics
paymentRoutes.get('/monthly-stats', async (c) => {
  try {
    const monthlyData: { [key: string]: any } = {};
    
    submissions.forEach(submission => {
      const date = new Date(submission.upload_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }
      
      monthlyData[monthKey].total++;
      monthlyData[monthKey][submission.status]++;
    });

    const monthlyStats = Object.values(monthlyData)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    return c.json({ success: true, monthlyStats });
  } catch (error) {
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

    const submission = submissions.find(s => s.submission_id === submissionId);

    if (!submission) {
      return c.json({ success: false, message: 'Submission not found' }, 404);
    }

    return c.json({ 
      success: true, 
      submission: {
        ...submission,
        id: submission.submission_id,
        file_size_mb: (submission.file_size / 1024 / 1024).toFixed(2),
        upload_date_formatted: new Date(submission.upload_date).toLocaleString()
      }
    });
  } catch (error) {
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

    const submission = submissions.find(s => s.submission_id === submissionId);

    if (!submission) {
      return c.json({ success: false, message: 'Submission not found' }, 404);
    }

    if (submission.status !== 'pending') {
      return c.json({ success: false, message: 'Submission has already been processed' }, 400);
    }

    // Generate permit number
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const seq = String(submissionId).padStart(4, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const permitNumber = `PM${year}${seq}${day}`;

    // Update submission
    submission.status = 'approved';
    submission.permit_number = permitNumber;
    submission.admin_id = adminId;
    submission.updated_at = now.toISOString();
    submission.approval_notes = notes;

    console.log(`✅ Submission approved: ${submissionId} -> ${permitNumber}`);

    return c.json({
      success: true,
      message: 'Submission approved successfully',
      permitNumber,
      submission: {
        id: submission.submission_id,
        status: 'approved',
        permit_number: permitNumber
      }
    });
  } catch (error) {
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

    const submission = submissions.find(s => s.submission_id === submissionId);

    if (!submission) {
      return c.json({ success: false, message: 'Submission not found' }, 404);
    }

    if (submission.status !== 'pending') {
      return c.json({ success: false, message: 'Submission has already been processed' }, 400);
    }

    // Update submission
    submission.status = 'rejected';
    submission.admin_id = adminId;
    submission.updated_at = new Date().toISOString();
    submission.rejection_reason = reason;

    console.log(`❌ Submission rejected: ${submissionId} - ${reason}`);

    return c.json({
      success: true,
      message: 'Submission rejected successfully',
      submission: {
        id: submission.submission_id,
        status: 'rejected',
        rejection_reason: reason
      }
    });
  } catch (error) {
    console.error('Reject submission error:', error);
    return c.json({ success: false, message: 'Failed to reject submission' }, 500);
  }
});

export default paymentRoutes;
