import { Hono } from 'hono';

// Mock data storage - works without database
let mockUsers = {
  admins: [
    { admin_id: 'admin001', fullname: 'System Administrator', email: 'admin@paytopermit.com', password: 'admin123' },
    { admin_id: 'admin002', fullname: 'Finance Officer', email: 'finance@paytopermit.com', password: 'finance123' }
  ],
  students: [
    { student_id: 'student001', fullname: 'John Doe', email: 'john.doe@university.edu', password: 'student123', department: 'Computer Science' },
    { student_id: 'student002', fullname: 'Jane Smith', email: 'jane.smith@university.edu', password: 'student123', department: 'Engineering' },
    { student_id: 'student003', fullname: 'Mike Johnson', email: 'mike.johnson@university.edu', password: 'student123', department: 'Business' }
  ]
};

const authRoutes = new Hono();

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    
    if (!email || !password || !role) {
      return c.json({ success: false, message: 'Email, password, and role are required' }, 400);
    }

    const users = role === 'admin' ? mockUsers.admins : mockUsers.students;
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
});

// Registration endpoint
authRoutes.post('/register', async (c) => {
  try {
    const { fullname, email, address, phone, department, password, role, id } = await c.req.json();
    
    console.log('Registration request:', { fullname, email, address, phone, department, role, id });

    if (!fullname || !email || !address || !phone || !password || !role || !id) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }

    if (role === 'student' && !department) {
      return c.json({ success: false, message: 'Department is required for students' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }

    // Validate phone format
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return c.json({ success: false, message: 'Invalid phone format' }, 400);
    }

    // Check if user already exists
    const users = role === 'admin' ? mockUsers.admins : mockUsers.students;
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 409);
    }

    // Add new user to mock data
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
});

// Reset password endpoint
authRoutes.post('/reset-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    const allUsers = [...mockUsers.admins, ...mockUsers.students];
    const user = allUsers.find(u => u.email === email);

    if (!user) {
      return c.json({ success: false, message: 'Email not found' }, 404);
    }

    return c.json({ success: true, message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ success: false, message: 'Reset password failed' }, 500);
  }
});

export default authRoutes;
