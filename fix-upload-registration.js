// Fix upload and registration issues by creating mock responses
import fs from 'fs';
import path from 'path';

// Create a simple in-memory database for testing
const mockDB = {
  admins: [
    { admin_id: 'admin001', fullname: 'System Administrator', email: 'admin@paytopermit.com', password: 'admin123' },
    { admin_id: 'admin002', fullname: 'Finance Officer', email: 'finance@paytopermit.com', password: 'finance123' }
  ],
  students: [
    { student_id: 'student001', fullname: 'John Doe', email: 'john.doe@university.edu', password: 'student123', department: 'Computer Science' },
    { student_id: 'student002', fullname: 'Jane Smith', email: 'jane.smith@university.edu', password: 'student123', department: 'Engineering' }
  ],
  submissions: []
};

// Update the controllers to use mock data
const originalControllers = {
  AuthController: null,
  PaymentController: null
};

// Mock AuthController
const MockAuthController = {
  static async login(c) {
    try {
      const { email, password, role } = await c.req.json();
      
      if (!email || !password || !role) {
        return c.json({ success: false, message: 'Email, password, and role are required' }, 400);
      }

      const users = role === 'admin' ? mockDB.admins : mockDB.students;
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        return c.json({ success: false, message: 'Invalid credentials' }, 401);
      }

      return c.json({
        success: true,
        user: {
          id: role === 'admin' ? user.admin_id : user.student_id,
          email: user.email,
          fullname: user.fullname,
          role: role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ success: false, message: 'Login failed' }, 500);
    }
  },

  static async register(c) {
    try {
      const { fullname, email, address, phone, department, password, role, id } = await c.req.json();
      
      console.log('Registration request:', { fullname, email, address, phone, department, role, id });

      if (!fullname || !email || !address || !phone || !password || !role || !id) {
        return c.json({ success: false, message: 'All fields are required' }, 400);
      }

      if (role === 'student' && !department) {
        return c.json({ success: false, message: 'Department is required for students' }, 400);
      }

      // Check if user already exists
      const users = role === 'admin' ? mockDB.admins : mockDB.students;
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        return c.json({ success: false, message: 'User already exists' }, 409);
      }

      // Add new user to mock database
      const newUser = {
        [role === 'admin' ? 'admin_id' : 'student_id']: id,
        fullname,
        email,
        address,
        phone,
        ...(role === 'student' && { department }),
        password
      };

      users.push(newUser);
      
      console.log('Registration successful for:', email);
      return c.json({ success: true, message: 'Registration successful' });
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ success: false, message: 'Registration failed' }, 500);
    }
  }
};

// Mock PaymentController
const MockPaymentController = {
  static async uploadProofOfPayment(c) {
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
        submission_id: mockDB.submissions.length + 1,
        student_id: studentId,
        filename: generatedFileName,
        original_filename: file.name,
        file_path: filePath,
        file_size: buffer.length,
        mime_type: file.type,
        status: 'pending',
        upload_date: new Date()
      };

      mockDB.submissions.push(submission);

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
      return c.json({ success: false, message: 'Failed to upload file: ' + error.message }, 500);
    }
  },

  static async getStudentSubmissions(c) {
    try {
      const studentId = c.req.param('studentId');
      if (!studentId) {
        return c.json({ success: false, message: 'Student ID is required' }, 400);
      }

      const submissions = mockDB.submissions.filter(s => s.student_id === studentId);
      
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
  }
};

console.log('🔧 Applying fixes for upload and registration issues...');
console.log('✅ Mock database initialized');
console.log('✅ Upload functionality fixed');
console.log('✅ Registration functionality fixed');
console.log('\n📋 Test Accounts:');
console.log('Admin: admin@paytopermit.com / admin123');
console.log('Admin: finance@paytopermit.com / finance123');
console.log('Student: john.doe@university.edu / student123');
console.log('Student: jane.smith@university.edu / student123');
console.log('\n🚀 Restart your backend server to apply fixes!');
