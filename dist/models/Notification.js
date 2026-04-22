import db from '../config/db.js';
export class NotificationModel {
    static async create(notification) {
        try {
            const [result] = await db.query('INSERT INTO Notifications (user_id, user_role, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)', [
                notification.user_id,
                notification.role,
                notification.title,
                notification.message,
                notification.type,
                notification.read ? 1 : 0
            ]);
            return result.insertId;
        }
        catch (error) {
            console.error('Database error in createNotification:', error);
            throw error;
        }
    }
    static async getByUserId(userId, role) {
        try {
            const [rows] = await db.query('SELECT * FROM Notifications WHERE user_id = ? AND user_role = ? ORDER BY created_at DESC', [userId, role]);
            const notifications = Array.isArray(rows) ? rows : [];
            return notifications.map((notif) => ({
                id: notif.notification_id || notif.id,
                user_id: notif.user_id,
                role: notif.user_role,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                read: notif.is_read === 1 || notif.is_read === true,
                created_at: notif.created_at
            }));
        }
        catch (error) {
            console.error('Database error in getByUserId:', error);
            throw error;
        }
    }
    static async markAsRead(notificationId) {
        try {
            await db.query('UPDATE Notifications SET is_read = 1 WHERE notification_id = ?', [notificationId]);
        }
        catch (error) {
            console.error('Database error in markAsRead:', error);
            throw error;
        }
    }
    static async markAllAsRead(userId, role) {
        try {
            await db.query('UPDATE Notifications SET is_read = 1 WHERE user_id = ? AND user_role = ?', [userId, role]);
        }
        catch (error) {
            console.error('Database error in markAllAsRead:', error);
            throw error;
        }
    }
    static async getUnreadCount(userId, role) {
        try {
            const [rows] = await db.query('SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND user_role = ? AND is_read = 0', [userId, role]);
            const result = Array.isArray(rows) && rows.length > 0 ? rows[0].count : 0;
            return result;
        }
        catch (error) {
            console.error('Database error in getUnreadCount:', error);
            throw error;
        }
    }
}
