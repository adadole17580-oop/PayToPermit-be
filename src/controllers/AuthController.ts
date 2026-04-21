import type { Context } from 'hono';
import { UserModel } from '../models/User.js';

export class AuthController {
  static async login(c: Context) {
    try {
      const { email, password, role } = await c.req.json();

      if (!email || !password || !role) {
        return c.json({ success: false, message: 'Email, password, and role are required' }, 400);
      }

      const user = await UserModel.findByEmailAndPassword(email, password, role);

      if (!user) {
        return c.json({ success: false, message: 'Invalid credentials' }, 401);
      }

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ success: false, message: 'Login failed' }, 500);
    }
  }

  static async register(c: Context) {
    try {
      const { fullname, email, address, phone, department, password, role, id } = await c.req.json();

      console.log('Registration request data:', { fullname, email, address, phone, department, role, id });

      if (!fullname || !email || !address || !phone || !password || !role || !id) {
        console.log('Missing fields:', { fullname: !!fullname, email: !!email, address: !!address, phone: !!phone, password: !!password, role: !!role, id: !!id });
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

      await UserModel.create({
        id,
        fullname,
        email,
        address,
        phone,
        department,
        password,
        role
      });

      console.log('Registration successful for:', email);
      return c.json({ success: true, message: 'Registration successful' });
    } catch (error) {
      console.error('Registration error:', error);
      const err = error as any;
      if (err.code === 'ER_DUP_ENTRY') {
        return c.json({ success: false, message: 'User already exists' }, 409);
      }
      if (err.code === 'ER_NO_SUCH_TABLE') {
        return c.json({ success: false, message: 'Database not initialized. Please run database setup first.' }, 500);
      }
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return c.json({ success: false, message: 'Database schema error. Please run database setup first.' }, 500);
      }
      return c.json({ success: false, message: 'Registration failed: ' + err.message }, 500);
    }
  }

  static async resetPassword(c: Context) {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ success: false, message: 'Email is required' }, 400);
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        return c.json({ success: false, message: 'Email not found' }, 404);
      }

      // In a real application, you would send a password reset email here
      // For now, we'll just return success
      return c.json({ success: true, message: 'Password reset link sent to email' });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json({ success: false, message: 'Reset password failed' }, 500);
    }
  }
}