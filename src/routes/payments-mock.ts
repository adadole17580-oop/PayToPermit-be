import { Hono } from 'hono';

// Mock data storage - works without database
let mockSubmissions: any[] = [];
let mockFees = [
  { fee_id: 1, name: 'Library Fee', amount: 50.00, description: 'Annual library access fee', category: 'Academic', academic_year: '2024-2025' },
  { fee_id: 2, name: 'Laboratory Fee', amount: 100.00, description: 'Science laboratory equipment', category: 'Academic', academic_year: '2024-2025' },
  { fee_id: 3, name: 'Sports Fee', amount: 75.00, description: 'Sports facilities access', category: 'Extracurricular', academic_year: '2024-2025' },
  { fee_id: 4, name: 'Technology Fee', amount: 150.00, description: 'Computer lab and IT infrastructure', category: 'Academic', academic_year: '2024-2025' }
];

const paymentRoutes = new Hono();

// Upload endpoint
paymentRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;

    console.log('Upload request:', { file: file?.name, studentId });

    if (!file || !studentId) {
      return c.json({ success: false, message: 'File and student ID are required' }, 400);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, message: 'Only PDF, JPG, and PNG files are allowed' }, 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({ success: false, message: 'File size must be less than 5MB' }, 400);
    }

    // Create uploads directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate filename
    const now = new Date();
    const timestamp = now.getTime();
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const generatedFileName = `${studentId}_${timestamp}.${fileExtension}`;
    const filePath = path.join(uploadDir, generatedFileName);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Add to mock database
    const submission = {
      submission_id: mockSubmissions.length + 1,
      student_id: studentId,
      filename: generatedFileName,
      original_filename: file.name,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type,
      status: 'pending',
      upload_date: new Date()
    };

    mockSubmissions.push(submission);

    console.log('Upload successful:', { submission_id: submission.submission_id, filename: generatedFileName });
    
    return c.json({
      success: true,
      message: 'File uploaded successfully',
      submission: {
        id: submission.submission_id,
        filename: generatedFileName,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ success: false, message: 'Upload failed: ' + (error as Error).message }, 500);
  }
});

// Get student submissions
paymentRoutes.get('/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    if (!studentId) {
      return c.json({ success: false, message: 'Student ID is required' }, 400);
    }

    const submissions = mockSubmissions.filter(s => s.student_id === studentId);
    
    return c.json({ 
      success: true, 
      submissions: submissions.map(s => ({
        ...s,
        permit_number: s.permit_number || '-',
        id: s.submission_id
      }))
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
  }
});

// Get all submissions
paymentRoutes.get('/all', async (c) => {
  try {
    return c.json({ success: true, submissions: mockSubmissions });
  } catch (error) {
    console.error('Get all submissions error:', error);
    return c.json({ success: false, message: 'Failed to retrieve submissions' }, 500);
  }
});

// Get stats
paymentRoutes.get('/stats', async (c) => {
  try {
    const stats = {
      total: mockSubmissions.length,
      approved: mockSubmissions.filter(s => s.status === 'approved').length,
      rejected: mockSubmissions.filter(s => s.status === 'rejected').length,
      pending: mockSubmissions.filter(s => s.status === 'pending').length
    };
    
    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ success: false, message: 'Failed to retrieve statistics' }, 500);
  }
});

// Get monthly stats
paymentRoutes.get('/monthly-stats', async (c) => {
  try {
    // Simple mock monthly stats
    const monthlyStats = [
      { month: '2024-12', total: 5, approved: 3, rejected: 1 },
      { month: '2025-01', total: 8, approved: 6, rejected: 2 }
    ];
    
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

    const submission = mockSubmissions.find(s => s.submission_id === submissionId);

    if (!submission) {
      return c.json({ success: false, message: 'Submission not found' }, 404);
    }

    return c.json({ success: true, submission });
  } catch (error) {
    console.error('Get submission by ID error:', error);
    return c.json({ success: false, message: 'Failed to retrieve submission' }, 500);
  }
});

// Approve submission
paymentRoutes.put('/:id/approve', async (c) => {
  try {
    const submissionId = parseInt(c.req.param('id') || '0');
    const { adminId } = await c.req.json();

    if (!submissionId || !adminId) {
      return c.json({ success: false, message: 'Submission ID and admin ID are required' }, 400);
    }

    // Generate permit number
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const permitNumber = `PM${year}${seq}${day}-${adminId}`;

    // Update submission in mock data
    const submission = mockSubmissions.find(s => s.submission_id === submissionId);
    if (submission) {
      submission.status = 'approved';
      submission.permit_number = permitNumber;
      submission.admin_id = adminId;
    }

    return c.json({
      success: true,
      message: 'Submission approved',
      permitNumber
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
    const { adminId } = await c.req.json();

    if (!submissionId) {
      return c.json({ success: false, message: 'Submission ID is required' }, 400);
    }

    // Update submission in mock data
    const submission = mockSubmissions.find(s => s.submission_id === submissionId);
    if (submission) {
      submission.status = 'rejected';
      submission.admin_id = adminId;
    }

    return c.json({
      success: true,
      message: 'Submission rejected'
    });
  } catch (error) {
    console.error('Reject submission error:', error);
    return c.json({ success: false, message: 'Failed to reject submission' }, 500);
  }
});

export default paymentRoutes;
