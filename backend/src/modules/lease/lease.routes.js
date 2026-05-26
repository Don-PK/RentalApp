import { Router } from 'express';
import { create, close } from './lease.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN', 'AGENT'), create);
router.patch('/:id/close', requireRole('ADMIN', 'AGENT'), close);

export default router;