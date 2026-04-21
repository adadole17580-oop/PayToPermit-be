import type { Context } from 'hono';
import { NotificationModel } from '../models/Notification.js';

export class NotificationController {
  static async getByUser(c: Context) {
    try {
      const userId = c.req.param('userId');
      const role = c.req.query('role') as 'student' | 'admin';

      if (!userId || !role) {
        return c.json({ success: false, message: 'User ID and role are required' }, 400);
      }

      const notifications = await NotificationModel.getByUserId(userId, role);
      const unreadCount = await NotificationModel.getUnreadCount(userId, role);

      return c.json({
        success: true,
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return c.json({ success: false, message: 'Failed to retrieve notifications' }, 500);
    }
  }

  static async markAsRead(c: Context) {
    try {
      const notificationId = parseInt(c.req.param('id') || '0');

      if (!notificationId) {
        return c.json({ success: false, message: 'Notification ID is required' }, 400);
      }

      await NotificationModel.markAsRead(notificationId);

      return c.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return c.json({ success: false, message: 'Failed to mark notification as read' }, 500);
    }
  }

  static async markAllAsRead(c: Context) {
    try {
      const { userId, role } = await c.req.json();

      if (!userId || !role) {
        return c.json({ success: false, message: 'User ID and role are required' }, 400);
      }

      await NotificationModel.markAllAsRead(userId, role);

      return c.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return c.json({ success: false, message: 'Failed to mark all notifications as read' }, 500);
    }
  }

  static async create(c: Context) {
    try {
      const { userId, role, title, message, type } = await c.req.json();

      if (!userId || !role || !title || !message || !type) {
        return c.json({ success: false, message: 'All fields are required' }, 400);
      }

      const notificationId = await NotificationModel.create({
        user_id: userId,
        role,
        title,
        message,
        type,
        read: false
      });

      return c.json({
        success: true,
        message: 'Notification created',
        notificationId
      });
    } catch (error) {
      console.error('Create notification error:', error);
      return c.json({ success: false, message: 'Failed to create notification' }, 500);
    }
  }
}
