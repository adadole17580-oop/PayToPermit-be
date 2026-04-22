import { Hono } from 'hono';
import { StudentController } from '../controllers/StudentController.js';
const studentRoutes = new Hono();
studentRoutes.get('/', StudentController.getAll);
studentRoutes.get('/:id', StudentController.getById);
studentRoutes.put('/:id', StudentController.updateProfile);
export default studentRoutes;
