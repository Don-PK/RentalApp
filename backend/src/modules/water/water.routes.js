import { Router } from 'express';
import { record, list } from './water.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.post('/record', record);
router.get('/', list);

export default router;
