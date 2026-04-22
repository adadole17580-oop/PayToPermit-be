import { Hono } from 'hono';
import { NotificationController } from '../controllers/NotificationController.js';
const notificationRoutes = new Hono();
notificationRoutes.get('/:userId', NotificationController.getByUser);
notificationRoutes.post('/:id/read', NotificationController.markAsRead);
notificationRoutes.post('/read-all', NotificationController.markAllAsRead);
notificationRoutes.post('/', NotificationController.create);
export default notificationRoutes;
