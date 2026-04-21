import type { Context } from 'hono';
import { UserModel } from '../models/User.js';

export class StudentController {
  static async getAll(c: Context) {
    try {
      const students = await UserModel.getAllStudents();
      return c.json({ success: true, students });
    } catch (error) {
      console.error('Database error:', error);
      return c.json({ success: false, message: 'Database connection failed' }, 500);
    }
  }

  static async getById(c: Context) {
    try {
      const id = c.req.param('id');
      if (!id) {
        return c.json({ success: false, message: 'Student ID is required' }, 400);
      }

      const student = await UserModel.findById(id, 'student');
      if (!student) {
        return c.json({ success: false, message: 'Student not found' }, 404);
      }

      return c.json({ success: true, student });
    } catch (error) {
      console.error('Get student error:', error);
      return c.json({ success: false, message: 'Failed to retrieve student' }, 500);
    }
  }

  static async updateProfile(c: Context) {
    try {
      const id = c.req.param('id');
      if (!id) {
        return c.json({ success: false, message: 'Student ID is required' }, 400);
      }

      const updateData = await c.req.json();
      const allowedFields = ['fullname', 'email', 'address', 'phone', 'department', 'password'];
      const payload: Record<string, any> = {};

      for (const field of allowedFields) {
        if (field in updateData) {
          payload[field] = updateData[field];
        }
      }

      if (Object.keys(payload).length === 0) {
        return c.json({ success: false, message: 'No update fields provided' }, 400);
      }

      await UserModel.update(id, 'student', payload);
      return c.json({ success: true, message: 'Student profile updated' });
    } catch (error) {
      console.error('Update student profile error:', error);
      return c.json({ success: false, message: 'Failed to update student profile' }, 500);
    }
  }
}