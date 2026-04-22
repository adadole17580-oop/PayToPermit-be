import type { Context } from 'hono';
import { UserModel } from '../models/User.js';

const payments: any[] = [];

export const AuthController = {

  async login(c: Context) {
    try {
      const { email, password, role } = await c.req.json();

      if (!email || !password) {
        return c.json({ success: false, message: 'Email and password are required' }, 400);
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

    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: 'Login failed' }, 500);
    }
  },

  async register(c: Context) {
    try {
      const { fullname, email, address, phone, department, password, role, id } =
        await c.req.json();

      if (!fullname || !email || !address || !phone || !password || !role || !id) {
        return c.json({ success: false, message: 'All fields are required' }, 400);
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

      return c.json({ success: true, message: 'Registration successful' });

    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: 'Registration failed' }, 500);
    }
  },

  async resetPassword(c: Context) {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json({ success: false, message: 'Email is required' }, 400);
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        return c.json({ success: false, message: 'Email not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Password reset link sent'
      });

    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: 'Reset failed' }, 500);
    }
  },

  async upload(c: Context) {
    const { student_id, file } = await c.req.json();

    if (!student_id || !file) {
      return c.json({ success: false, message: 'Missing data' }, 400);
    }

    const payment = {
      id: `pay_${Date.now()}`,
      student_id,
      file,
      status: 'pending',
      created_at: new Date()
    };

    payments.push(payment);

    return c.json({ success: true, payment });
  },

  async getPayments(c: Context) {
    return c.json({ success: true, payments });
  },

  async updatePayment(c: Context) {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    const payment = payments.find(p => p.id === id);

    if (!payment) {
      return c.json({ success: false, message: 'Not found' }, 404);
    }

    payment.status = status;

    return c.json({ success: true, payment });
  },

  async getStudentPayments(c: Context) {
    const id = c.req.param('id');

    const result = payments.filter(p => p.student_id === id);

    return c.json({ success: true, payments: result });
  }
};