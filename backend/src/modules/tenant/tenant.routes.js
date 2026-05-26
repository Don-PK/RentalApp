import { Router } from 'express';
import { create, getById, list, getDebtors } from './tenant.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.get('/debtors', requireRole('ADMIN', 'AGENT'), getDebtors);
router.post('/', requireRole('ADMIN', 'AGENT'), create);
router.get('/', requireRole('ADMIN', 'AGENT'), list);
router.get('/:id', requireRole('ADMIN', 'AGENT'), getById);

export default router;