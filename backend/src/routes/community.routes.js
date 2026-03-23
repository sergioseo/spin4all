const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/progression', authenticateToken, communityController.getProgression);
router.get('/stats', authenticateToken, communityController.getStats);
router.get('/attendance-ranking', authenticateToken, communityController.getAttendanceRanking);
router.get('/hall-fama', authenticateToken, communityController.getHallFama);
router.get('/evolution-ranking', authenticateToken, communityController.getEvolutionRanking);

module.exports = router;
