import { Router } from 'express';
import { generate, list } from './invoice.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.post('/generate', requireRole('ADMIN'), generate);
router.get('/', list);

export default router;