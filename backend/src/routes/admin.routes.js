const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const MonitoringController = require('../controllers/admin/monitoring.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/reports', authenticateToken, isAdmin, adminController.getReports);
router.get('/members', authenticateToken, isAdmin, adminController.getMembers);
router.get('/monitoring/status', authenticateToken, isAdmin, MonitoringController.getGlobalStatus);
router.put('/toggle-admin', authenticateToken, isAdmin, adminController.toggleAdmin);
router.get('/advanced-metrics', authenticateToken, isAdmin, adminController.getAdvancedMetrics);
router.get('/objectives-summary', authenticateToken, isAdmin, adminController.getObjectivesSummary);
router.get('/technical-bottleneck', authenticateToken, isAdmin, adminController.getTechnicalBottleneck);
router.get('/biomechanical-effort', authenticateToken, isAdmin, adminController.getBiomechanicalEffort);

module.exports = router;
