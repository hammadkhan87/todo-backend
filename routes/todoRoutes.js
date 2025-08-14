import express from 'express';
import { 
  createTodo, 
  getTodos, 
  getTodoById, 
  updateTodo, 
  deleteTodo, 
  toggleTodo 
} from '../controllers/todoController.js';
import { authenticateToken, sanitizeInput } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply input sanitization to write operations
router.post('/', sanitizeInput, createTodo);
router.put('/:id', sanitizeInput, updateTodo);
router.patch('/:id/toggle', toggleTodo);
router.delete('/:id', deleteTodo);

// Read operations
router.get('/', getTodos);
router.get('/:id', getTodoById);

export default router;