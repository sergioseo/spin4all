const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const settingsController = require('../controllers/admin/settings.controller');
const MonitoringController = require('../controllers/admin/monitoring.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

router.get('/settings', authenticateToken, isAdmin, settingsController.getSettings);
router.put('/settings', authenticateToken, isAdmin, settingsController.updateSettings);

router.get('/reports', authenticateToken, isAdmin, adminController.getReports);
router.get('/members', authenticateToken, isAdmin, adminController.getMembers);
router.get('/test', authenticateToken, isAdmin, (req, res) => res.json({ success: true, message: 'Admin API is reachable' }));
router.get('/monitoring/status', authenticateToken, isAdmin, MonitoringController.getGlobalStatus);
router.post('/monitoring/trigger-etl', authenticateToken, isAdmin, MonitoringController.triggerETL);
router.post('/monitoring/trigger-analysis', authenticateToken, isAdmin, MonitoringController.triggerAnalysis);
router.delete('/monitoring/logs', authenticateToken, isAdmin, MonitoringController.clearLogs);
router.put('/toggle-admin', authenticateToken, isAdmin, adminController.toggleAdmin);
router.get('/advanced-metrics', authenticateToken, isAdmin, adminController.getAdvancedMetrics);
router.get('/objectives-summary', authenticateToken, isAdmin, adminController.getObjectivesSummary);
router.get('/technical-bottleneck', authenticateToken, isAdmin, adminController.getTechnicalBottleneck);
router.get('/biomechanical-effort', authenticateToken, isAdmin, adminController.getBiomechanicalEffort);

module.exports = router;
