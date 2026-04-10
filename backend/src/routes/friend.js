// Friend routes
import express from 'express';
import friendController from '../controllers/friendController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

router.post('/request/send', friendController.sendRequest);
router.post('/request/accept', friendController.acceptRequest);
router.post('/request/reject', friendController.rejectRequest);
router.get('/requests/pending', friendController.getPending);
router.get('/requests/sent', friendController.getSent);
router.post('/remove', friendController.removeFriend);

export default router;
