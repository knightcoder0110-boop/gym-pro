import { Router } from 'express';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getBookings,
  createBooking,
  cancelBooking,
  markAttendance,
  getWeeklySchedule,
} from '../controllers/class.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// Class management
router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/', createClass);
router.patch('/:id', updateClass);
router.delete('/:id', deleteClass);

// Schedule management
router.get('/schedules/all', getSchedules);
router.get('/schedules/weekly', getWeeklySchedule);
router.post('/schedules', createSchedule);
router.patch('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Booking management
router.get('/bookings/all', getBookings);
router.post('/bookings', createBooking);
router.post('/bookings/:id/cancel', cancelBooking);
router.post('/bookings/:id/attendance', markAttendance);

export default router;
