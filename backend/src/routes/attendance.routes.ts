import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getTodayAttendance,
  getMemberAttendance,
  checkInByQR,
  checkInByMemberId,
} from '../controllers/attendance.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/check-in/qr', checkInByQR);
router.post('/check-in/member-id', checkInByMemberId);
router.get('/', getAttendanceHistory);
router.get('/today', getTodayAttendance);
router.get('/member/:memberId', getMemberAttendance);

export default router;
