/**
 * SPIN4ALL: Governance Routes Hub
 * Conecta o Frontend às missões do BOLT Engine. 🛡️🛰️🔗
 */

const express = require('express');
const router = express.Router();
const GovernanceController = require('../controllers/governance.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');

// --- MISSION CONTROL ---
// Despachar missão para a fila
router.post('/governance/dispatch', authenticateToken, isAdmin, GovernanceController.dispatchMission);

// Consultar status de uma missão (BullMQ Monitoring)
router.get('/governance/status/:jobId', authenticateToken, isAdmin, GovernanceController.getMissionStatus);

// Consultar logs em tempo real de uma missão
router.get('/governance/logs/:jobId', authenticateToken, isAdmin, GovernanceController.getMissionLogs);

// Visualizar Sandbox (Preview Visual)
router.get('/governance/preview/:missionId', authenticateToken, isAdmin, GovernanceController.getSandboxPreview);

// Mover para Fila de Produção (Stage 3 - Staging)
router.post('/governance/prepare', authenticateToken, isAdmin, GovernanceController.prepareMission);

// Aplicar ao ambiente local (Injeção Local)
router.post('/governance/apply-local', authenticateToken, isAdmin, GovernanceController.applyToLocal);

// Aprovar missões em Staging (Manual Approval Action)
router.post('/governance/approve', authenticateToken, isAdmin, GovernanceController.approveMission);

// Aplicar ao ambiente local (Injeção Local - Draft)
router.post('/governance/apply-local', authenticateToken, isAdmin, GovernanceController.applyToLocal);

// Limpar ambiente local (Remover Patches)
router.delete('/governance/clean-local', authenticateToken, isAdmin, GovernanceController.cleanLocalPatches);

module.exports = router;
