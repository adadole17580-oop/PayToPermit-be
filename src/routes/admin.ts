import { Hono } from 'hono';
import { AdminController } from '../controllers/AdminController.js';

const adminRoutes = new Hono();

adminRoutes.get('/:id', AdminController.getById);
adminRoutes.put('/:id', AdminController.updateProfile);

export default adminRoutes;
