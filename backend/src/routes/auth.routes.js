const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const resetController = require('../controllers/password-reset.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.get('/registration-status', authController.checkRegistrationStatus);

// Password Reset (BOLT Protocol)
router.post('/password-reset/request', resetController.forgotPassword);
router.post('/password-reset/reset', resetController.resetPassword);

module.exports = router;
