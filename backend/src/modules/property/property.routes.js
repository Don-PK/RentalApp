import { Router } from 'express';
import { assignAgent, create, getById, list } from './property.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN'), create);
router.patch('/:id/assign-agent', requireRole('ADMIN'), assignAgent);
router.get('/', list);
router.get('/:id', getById);

export default router;