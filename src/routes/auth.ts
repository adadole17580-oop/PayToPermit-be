import { Hono } from 'hono';
import { AuthController } from '../controllers/AuthController.js';

const authRoutes = new Hono();

authRoutes.post('/login', (c) => AuthController.login(c));
authRoutes.post('/register', (c) => AuthController.register(c));
authRoutes.post('/reset-password', (c) => AuthController.resetPassword(c));

authRoutes.post('/upload', (c) => AuthController.upload(c));
authRoutes.get('/payments', (c) => AuthController.getPayments(c));
authRoutes.put('/payments/:id', (c) => AuthController.updatePayment(c));
authRoutes.get('/payments/student/:id', (c) => AuthController.getStudentPayments(c));

export default authRoutes;