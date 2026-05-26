import { Router } from 'express';
import { changePassword, forgot, login, register, reset } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgot);
router.post('/reset-password', reset);
router.post('/change-initial-password', requireAuth, changePassword);

export default router;
