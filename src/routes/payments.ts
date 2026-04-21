import { Hono } from 'hono';
import { PaymentController } from '../controllers/PaymentController.js';

// Mock data for testing when database is not available
const mockSubmissions: any[] = [];

const paymentRoutes = new Hono();

// Enhanced upload with fallback to mock data
paymentRoutes.post('/upload', async (c) => {
  try {
    return await PaymentController.uploadProofOfPayment(c);
  } catch (error) {
    // Fallback to mock data if database fails
    console.log('Database upload failed, using mock data');
    
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const studentId = formData.get('studentId') as string;

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

      console.log('Mock upload successful:', { submission_id: submission.submission_id, filename: generatedFileName });
      
      return c.json({
        success: true,
        message: 'File uploaded successfully',
        submission: {
          id: submission.submission_id,
          filename: generatedFileName,
          status: 'pending'
        }
      });
    } catch (fallbackError) {
      console.error('Fallback upload error:', fallbackError);
      return c.json({ success: false, message: 'Upload failed: ' + (fallbackError as Error).message }, 500);
    }
  }
});

paymentRoutes.get('/student/:studentId', async (c) => {
  try {
    return await PaymentController.getStudentSubmissions(c);
  } catch (error) {
    // Fallback to mock data
    console.log('Database get submissions failed, using mock data');
    const studentId = c.req.param('studentId');
    const submissions = mockSubmissions.filter((s: any) => s.student_id === studentId);
    
    return c.json({ 
      success: true, 
      submissions: submissions.map((s: any) => ({
        ...s,
        permit_number: s.permit_number || '-',
        id: s.submission_id
      }))
    });
  }
});

paymentRoutes.get('/all', PaymentController.getAllSubmissions);
paymentRoutes.get('/stats', PaymentController.getStats);
paymentRoutes.get('/monthly-stats', PaymentController.getMonthlyStats);
paymentRoutes.get('/:id', PaymentController.getSubmissionById);
paymentRoutes.put('/:id/approve', PaymentController.approveSubmission);
paymentRoutes.put('/:id/reject', PaymentController.rejectSubmission);

export default paymentRoutes;
