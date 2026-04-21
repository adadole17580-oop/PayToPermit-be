import db from '../config/db.js';

export interface NotificationData {
  id?: number;
  user_id: string;
  role: 'student' | 'admin';
  title: string;
  message: string;
  type: 'approved' | 'rejected' | 'pending' | 'warning' | 'info';
  read: boolean;
  created_at?: Date;
}

export class NotificationModel {
  static async create(notification: Omit<NotificationData, 'id' | 'created_at'>): Promise<number> {
    try {
      const [result] = await db.query(
        'INSERT INTO Notifications (user_id, role, title, message, type, read) VALUES (?, ?, ?, ?, ?, ?)',
        [
          notification.user_id,
          notification.role,
          notification.title,
          notification.message,
          notification.type,
          notification.read ? 1 : 0
        ]
      ) as any;

      return (result as any).insertId;
    } catch (error) {
      console.error('Database error in createNotification:', error);
      throw error;
    }
  }

  static async getByUserId(userId: string, role: 'student' | 'admin'): Promise<NotificationData[]> {
    try {
      const [rows] = await db.query(
        'SELECT * FROM Notifications WHERE user_id = ? AND role = ? ORDER BY created_at DESC',
        [userId, role]
      ) as any;
      const notifications = Array.isArray(rows) ? rows : [];

      return notifications.map((notif: any) => ({
        id: notif.notification_id || notif.id,
        user_id: notif.user_id,
        role: notif.role,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read === 1,
        created_at: notif.created_at
      }));
    } catch (error) {
      console.error('Database error in getByUserId:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: number): Promise<void> {
    try {
      await db.query(
        'UPDATE Notifications SET read = 1 WHERE notification_id = ?',
        [notificationId]
      );
    } catch (error) {
      console.error('Database error in markAsRead:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string, role: 'student' | 'admin'): Promise<void> {
    try {
      await db.query(
        'UPDATE Notifications SET read = 1 WHERE user_id = ? AND role = ?',
        [userId, role]
      );
    } catch (error) {
      console.error('Database error in markAllAsRead:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string, role: 'student' | 'admin'): Promise<number> {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND role = ? AND read = 0',
        [userId, role]
      ) as any;
      const result = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).count : 0;
      return result;
    } catch (error) {
      console.error('Database error in getUnreadCount:', error);
      throw error;
    }
  }
}
