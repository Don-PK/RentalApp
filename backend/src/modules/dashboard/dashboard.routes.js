// backend/src/modules/dashboard/dashboard.routes.js
import { Router } from 'express';
import { summary, debtorsList } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/summary', summary);
router.get('/debtors', debtorsList);

export default router;