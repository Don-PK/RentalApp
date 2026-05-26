import { Router } from 'express';
import { agents, create, deleteAgentController, sendReset } from './user.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();

router.use(requireAuth);
router.post('/', requireRole('ADMIN'), create);
router.get('/agents', requireRole('ADMIN'), agents);
router.post('/agents/:id/send-reset-link', requireRole('ADMIN'), sendReset);
router.delete('/:id', requireRole('ADMIN'), deleteAgentController);

export default router;
