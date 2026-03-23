const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/me', authenticateToken, userController.getMe);
router.put('/update-profile', authenticateToken, userController.updateProfile);
router.put('/update-password', authenticateToken, userController.updatePassword);
router.get('/effort-stats', authenticateToken, userController.getEffortStats);
router.post('/save-skills', authenticateToken, userController.saveSkills);
router.post('/save-mobility', authenticateToken, userController.saveMobility);
router.get('/badges', authenticateToken, userController.getBadges);

module.exports = router;
