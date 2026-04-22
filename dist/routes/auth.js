import { Hono } from 'hono';
import { AuthController } from '../controllers/AuthController.js';
const authRoutes = new Hono();
authRoutes.post('/login', AuthController.login);
authRoutes.post('/register', AuthController.register);
authRoutes.post('/reset-password', AuthController.resetPassword);
export default authRoutes;
