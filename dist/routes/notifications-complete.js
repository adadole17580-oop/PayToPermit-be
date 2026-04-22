import { Hono } from 'hono';
// Complete in-memory notifications system - no database required
export let notifications = [];
export let notificationIdCounter = 1;
const notificationRoutes = new Hono();
// Create notification
export function createNotification(userId, userRole, title, message, type) {
    const notification = {
        notification_id: notificationIdCounter++,
        user_id: userId,
        user_role: userRole,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    notifications.push(notification);
    return notification;
}
// Get user notifications
notificationRoutes.get('/user/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const role = c.req.query('role');
        const isRead = c.req.query('is_read');
        const limit = parseInt(c.req.query('limit') || '20');
        const page = parseInt(c.req.query('page') || '1');
        if (!userId || !role) {
            return c.json({ success: false, message: 'User ID and role are required' }, 400);
        }
        let userNotifications = notifications.filter(n => n.user_id === userId && n.user_role === role);
        // Filter by read status
        if (isRead !== undefined) {
            const readStatus = isRead === 'true';
            userNotifications = userNotifications.filter(n => n.is_read === readStatus);
        }
        // Sort by created date (newest first)
        userNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Pagination
        const startIndex = (page - 1) * limit;
        const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);
        return c.json({
            success: true,
            notifications: paginatedNotifications,
            pagination: {
                page,
                limit,
                total: userNotifications.length,
                pages: Math.ceil(userNotifications.length / limit)
            },
            unread_count: userNotifications.filter(n => !n.is_read).length
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return c.json({ success: false, message: 'Failed to retrieve notifications' }, 500);
    }
});
// Mark notification as read
notificationRoutes.put('/:id/read', async (c) => {
    try {
        const notificationId = parseInt(c.req.param('id') || '0');
        const { userId } = await c.req.json();
        if (!notificationId) {
            return c.json({ success: false, message: 'Notification ID is required' }, 400);
        }
        const notification = notifications.find(n => n.notification_id === notificationId);
        if (!notification) {
            return c.json({ success: false, message: 'Notification not found' }, 404);
        }
        if (userId && notification.user_id !== userId) {
            return c.json({ success: false, message: 'Access denied' }, 403);
        }
        notification.is_read = true;
        notification.updated_at = new Date().toISOString();
        return c.json({
            success: true,
            message: 'Notification marked as read',
            notification: {
                id: notification.notification_id,
                is_read: true
            }
        });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        return c.json({ success: false, message: 'Failed to mark notification as read' }, 500);
    }
});
// Mark all notifications as read
notificationRoutes.put('/user/:userId/read-all', async (c) => {
    try {
        const userId = c.req.param('userId');
        const role = c.req.query('role');
        if (!userId || !role) {
            return c.json({ success: false, message: 'User ID and role are required' }, 400);
        }
        let updatedCount = 0;
        notifications.forEach(notification => {
            if (notification.user_id === userId && notification.user_role === role && !notification.is_read) {
                notification.is_read = true;
                notification.updated_at = new Date().toISOString();
                updatedCount++;
            }
        });
        return c.json({
            success: true,
            message: `${updatedCount} notifications marked as read`,
            updated_count: updatedCount
        });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        return c.json({ success: false, message: 'Failed to mark notifications as read' }, 500);
    }
});
// Delete notification
notificationRoutes.delete('/:id', async (c) => {
    try {
        const notificationId = parseInt(c.req.param('id') || '0');
        const { userId } = await c.req.json();
        if (!notificationId) {
            return c.json({ success: false, message: 'Notification ID is required' }, 400);
        }
        const notificationIndex = notifications.findIndex(n => n.notification_id === notificationId);
        if (notificationIndex === -1) {
            return c.json({ success: false, message: 'Notification not found' }, 404);
        }
        const notification = notifications[notificationIndex];
        if (userId && notification.user_id !== userId) {
            return c.json({ success: false, message: 'Access denied' }, 403);
        }
        const deletedNotification = notifications.splice(notificationIndex, 1)[0];
        return c.json({
            success: true,
            message: 'Notification deleted successfully',
            deleted_notification: {
                id: deletedNotification.notification_id,
                title: deletedNotification.title
            }
        });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        return c.json({ success: false, message: 'Failed to delete notification' }, 500);
    }
});
// Get notification statistics
notificationRoutes.get('/stats/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const role = c.req.query('role');
        if (!userId || !role) {
            return c.json({ success: false, message: 'User ID and role are required' }, 400);
        }
        const userNotifications = notifications.filter(n => n.user_id === userId && n.user_role === role);
        const total = userNotifications.length;
        const unread = userNotifications.filter(n => !n.is_read).length;
        const read = total - unread;
        // Group by type
        const typeStats = {};
        userNotifications.forEach(n => {
            typeStats[n.type] = (typeStats[n.type] || 0) + 1;
        });
        return c.json({
            success: true,
            stats: {
                total,
                unread,
                read,
                unread_percentage: total > 0 ? ((unread / total) * 100).toFixed(1) : 0,
                by_type: typeStats
            }
        });
    }
    catch (error) {
        console.error('Get notification stats error:', error);
        return c.json({ success: false, message: 'Failed to retrieve notification statistics' }, 500);
    }
});
// Admin: Get all notifications
notificationRoutes.get('/admin/all', async (c) => {
    try {
        const limit = parseInt(c.req.query('limit') || '50');
        const page = parseInt(c.req.query('page') || '1');
        const role = c.req.query('role');
        const type = c.req.query('type');
        let allNotifications = [...notifications];
        // Apply filters
        if (role) {
            allNotifications = allNotifications.filter(n => n.user_role === role);
        }
        if (type) {
            allNotifications = allNotifications.filter(n => n.type === type);
        }
        // Sort by created date (newest first)
        allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Pagination
        const startIndex = (page - 1) * limit;
        const paginatedNotifications = allNotifications.slice(startIndex, startIndex + limit);
        return c.json({
            success: true,
            notifications: paginatedNotifications,
            pagination: {
                page,
                limit,
                total: allNotifications.length,
                pages: Math.ceil(allNotifications.length / limit)
            }
        });
    }
    catch (error) {
        console.error('Get all notifications error:', error);
        return c.json({ success: false, message: 'Failed to retrieve notifications' }, 500);
    }
});
// Admin: Create notification
notificationRoutes.post('/admin/create', async (c) => {
    try {
        const { userId, userRole, title, message, type } = await c.req.json();
        // Validation
        if (!userId || !userRole || !title || !message || !type) {
            return c.json({
                success: false,
                message: 'User ID, role, title, message, and type are required'
            }, 400);
        }
        if (!['student', 'admin'].includes(userRole)) {
            return c.json({ success: false, message: 'Invalid user role' }, 400);
        }
        const notification = createNotification(userId, userRole, title, message, type);
        console.log(`✅ Notification created for ${userRole} ${userId}: ${title}`);
        return c.json({
            success: true,
            message: 'Notification created successfully',
            notification: {
                id: notification.notification_id,
                user_id: userId,
                user_role: userRole,
                title,
                type,
                is_read: false,
                created_at: notification.created_at
            }
        });
    }
    catch (error) {
        console.error('Create notification error:', error);
        return c.json({ success: false, message: 'Failed to create notification' }, 500);
    }
});
export default notificationRoutes;
