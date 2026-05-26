import { Router } from 'express';
import { create, getInvoice, list } from './payment.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('ADMIN', 'AGENT'), create);
router.get('/', requireRole('ADMIN', 'AGENT'), list);
router.get('/invoice/:id', requireRole('ADMIN', 'AGENT'), getInvoice);

export default router;