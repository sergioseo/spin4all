const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnostic.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Submissão do Diagnóstico de 13 Passos (Protegido por Token)
router.post('/submit', authenticateToken, diagnosticController.submitDiagnostic);

module.exports = router;
