import { Hono } from 'hono';
import { AuthController } from '../controllers/AuthController.js';

const authRoutes = new Hono();

/* ===================== MOCK DATA ===================== */
const mockUsers = {
  admins: [
    {
      admin_id: 'admin001',
      fullname: 'System Administrator',
      email: 'admin@liceo.edu.ph',
      password: 'admin123'
    }
  ],
  students: []
};

/* ===================== LOGIN ===================== */
authRoutes.post('/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();

    console.log('Login attempt:', { email, role });

    if (!email || !password || !role) {
      return c.json({ success: false, message: 'Email, password, and role are required' }, 400);
    }

    // 🔹 Try database first
    try {
      return await AuthController.login(c);
    } catch (err) {
      console.error('Controller login failed → using mock:', err);
    }

    // 🔹 Fallback to mock
    const users = role === 'admin' ? mockUsers.admins : mockUsers.students;

    console.log('Available users:', users);

    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    // ❌ Prevent crash
    if (!user) {
      console.log('User not found');
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    // ✅ Safe ID extraction
    let userId = role === 'admin' ? user.admin_id : (user as any).student_id;

    if (!userId) {
      console.error('User found but ID missing:', user);
      return c.json({ success: false, message: 'User data corrupted' }, 500);
    }

    return c.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        fullname: user.fullname,
        role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, message: 'Login failed' }, 500);
  }
});


/* ===================== REGISTER ===================== */
authRoutes.post('/register', async (c) => {
  try {
    const { fullname, email, address, phone, department, password, role, id } = await c.req.json();

    console.log('Register attempt:', { email, role, id });

    // ✅ Validation
    if (!fullname || !email || !address || !phone || !password || !role || !id) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }

    if (role === 'student' && !department) {
      return c.json({ success: false, message: 'Department is required for students' }, 400);
    }

    // 🔹 Try database first
    try {
      return await AuthController.register(c);
    } catch (err) {
      console.error('Controller register failed → using mock:', err);
    }

    // 🔹 Fallback to mock
    const users = role === 'admin' ? mockUsers.admins : mockUsers.students;

    const existingUser = users.find((u: any) => u.email === email);

    if (existingUser) {
      return c.json({ success: false, message: 'User already exists' }, 409);
    }

    // ✅ Correct structure (IMPORTANT FIX)
    const newUser: any = {
      fullname,
      email,
      address,
      phone,
      password
    };

    if (role === 'admin') {
      newUser.admin_id = id;
    } else {
      newUser.student_id = id;
      newUser.department = department;
    }

    users.push(newUser);

    console.log('User registered successfully:', newUser);

    return c.json({
      success: true,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, message: 'Registration failed' }, 500);
  }
});


/* ===================== RESET PASSWORD ===================== */
authRoutes.post('/reset-password', async (c) => {
  try {
    return await AuthController.resetPassword(c);
  } catch (err) {
    console.error('Reset password failed:', err);
    return c.json({ success: false, message: 'Reset failed' }, 500);
  }
});

export default authRoutes;