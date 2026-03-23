const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/my-attendance', authenticateToken, attendanceController.getMyAttendance);
router.get('/user/attendance-calendar', authenticateToken, attendanceController.getAttendanceCalendar);
router.post('/checkin', authenticateToken, isAdmin, attendanceController.processCheckin);
router.delete('/checkin', authenticateToken, isAdmin, attendanceController.deleteCheckin);
router.get('/checkin-list', authenticateToken, isAdmin, attendanceController.getCheckinList);

module.exports = router;
