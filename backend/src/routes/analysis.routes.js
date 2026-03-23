const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/tournament-summary', authenticateToken, analysisController.getTournamentSummary);
router.get('/my-evolution', authenticateToken, analysisController.getEvolution);

module.exports = router;
