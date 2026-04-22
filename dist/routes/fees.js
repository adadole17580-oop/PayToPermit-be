import { Hono } from 'hono';
import { FeeController } from '../controllers/PaymentController.js';
const feeRoutes = new Hono();
feeRoutes.get('/', FeeController.getAll);
feeRoutes.get('/category', FeeController.getByCategory);
export default feeRoutes;
