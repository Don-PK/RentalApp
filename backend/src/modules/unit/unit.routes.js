import { Router } from 'express';
import { create, list, updateStatus, updateConditions } from './unit.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), create);
router.get('/', list);
router.patch('/:id/status', requireRole('ADMIN', 'AGENT'), updateStatus);
router.patch('/:id', requireRole('ADMIN', 'AGENT'), updateConditions);

export default router;

