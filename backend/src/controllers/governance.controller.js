/**
 * SPIN4ALL: Governance Controller (OPTIMIZED & ENHANCED LOGGING)
 * Orquestra as missões de governança com Lazy Loading e Logs Detalhados. ⚡🛡️
 */

const path = require('path');

// Caminhos constantes
const BOLT_ROOT = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core');
const BOLT_QUEUE_SERVICE_PATH = path.join(BOLT_ROOT, 'services', 'queue-service');
const BOLT_RUNNER_PATH = path.join(BOLT_ROOT, 'bolt-runner');
const PreviewService = require('../services/governance/PreviewService');

const GovernanceController = {
  /**
   * Helper privado para carregar o motor apenas quando necessário.
   */
  async _getEngine() {
    try {
      return {
        QueueService: require(BOLT_QUEUE_SERVICE_PATH),
        BoltRunner: require(BOLT_RUNNER_PATH)
      };
    } catch (err) {
      console.error('❌ [GOV:OPTIM] Falha ao carregar motor BOLT diferido:', err.message);
      throw new Error('BOLT_ENGINE_UNAVAILABLE');
    }
  },

  /**
   * Despacha uma nova missão de governança para a fila com Log Detalhado.
   */
  async dispatchMission(req, res) {
    const { intent } = req.body;
    
    if (!intent) {
      return res.status(400).json({ success: false, error: 'INTENT_REQUIRED' });
    }

    try {
      const { QueueService } = await GovernanceController._getEngine();
      const executionId = `missao_${Date.now()}`;
      
      console.log(`\n[SPIN4ALL:GOV] 📡 Nova Missão Recebida: "${intent.substring(0, 50)}${intent.length > 50 ? '...' : ''}"`);
      console.log(`[SPIN4ALL:GOV] 🆔 ID Interno: ${executionId}`);
      
      const result = await QueueService.dispatchMission(executionId, { intent });
      
      console.log(`[BOLT:QUEUE] ✅ Job #${result.id} enfileirado com sucesso para processamento.`);

      res.status(200).json({
        success: true,
        missionId: executionId,
        jobId: result.id,
        message: 'Missão enviada.'
      });
    } catch (err) {
      console.error('❌ [GOV:ERR_DISPATCH]', err.message);
      res.status(500).json({ success: false, error: 'GOV_DISPATCH_FAILED: ' + err.message });
    }
  },

  /**
   * Consulta o status de uma missão específica com Log de Estado.
   */
  async getMissionStatus(req, res) {
    const { jobId } = req.params;
    
    try {
      const { QueueService } = await GovernanceController._getEngine();
      const job = await QueueService.queue.getJob(jobId);
      
      if (!job) {
        console.log(`[BOLT:STATUS] ❓ Job #${jobId} não encontrado.`);
        return res.status(404).json({ success: false, error: 'JOB_NOT_FOUND' });
      }

      const state = await job.getState();
      const progress = job.progress !== undefined ? `${job.progress}%` : 'N/A';

      // Log informativo do polling
      let statusIcon = '🔄';
      if (state === 'completed') statusIcon = '✅';
      if (state === 'failed') statusIcon = '❌';
      if (state === 'active') statusIcon = '🧠';

      console.log(`[BOLT:STATUS] ${statusIcon} Job #${jobId} [${state.toUpperCase()}] - Progress: ${progress}`);

      res.status(200).json({
        success: true,
        jobId: job.id,
        state,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason
      });
    } catch (err) {
      console.error(`❌ [GOV:STATUS_ERR] Erro ao consultar Job #${jobId}:`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Aprova uma missão.
   */
  async approveMission(req, res) {
    const { executionId, releasePath } = req.body;
    
    if (!executionId || !releasePath) {
        console.log(`[SPIN4ALL:GOV] ⚠️ Tentativa de aprovação sem parâmetros: ID=${executionId}`);
        return res.status(400).json({ success: false, error: 'PARAM_MISSING' });
    }

    try {
      console.log(`\n[SPIN4ALL:GOV] ⚖️  APROVAÇÃO recebida para Missão: ${executionId}`);
      console.log(`[SPIN4ALL:GOV] 📦 Release Path: ${releasePath}`);
      
      const { BoltRunner } = await GovernanceController._getEngine();
      const runner = new BoltRunner();
      const result = await runner.approve(executionId, releasePath);
      
      if (result.success) {
          console.log(`[BOLT:LIVE] 🚀 PROMOÇÃO CONCLUÍDA! O código está agora em LIVE.`);
      } else {
          console.error(`[BOLT:LIVE] ❌ FALHA na promoção: ${result.error}`);
      }

      res.status(result.success ? 200 : 500).json(result);
    } catch (err) {
      console.error(`❌ [GOV:APPROVE_ERR]`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * ETAPA 2: Aciona a preparação para Staging após validação humana do rascunho.
   */
  async prepareMission(req, res) {
    const { executionId, manifest } = req.body;
    if (!executionId || !manifest) {
        return res.status(400).json({ success: false, error: 'PARAM_MISSING' });
    }

    try {
      console.log(`\n[SPIN4ALL:GOV] 🏗️  PREPARAÇÃO para Staging solicitada: ${executionId}`);
      
      const { BoltRunner } = await GovernanceController._getEngine();
      const runner = new BoltRunner();
      
      // O prepare rodará de forma síncrona para esta transição de estado rápida
      const result = await runner.prepare(executionId, manifest);
      
      res.status(result.success ? 200 : 500).json(result);
    } catch (err) {
      console.error(`❌ [GOV:PREPARE_ERR]`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * FLUSH: Aplica o rascunho da Sandbox ao workspace local.
   */
  async applyToLocal(req, res) {
    const { executionId } = req.body;
    if (!executionId) return res.status(400).json({ success: false, error: 'EXECUTION_ID_REQUIRED' });

    try {
      console.log(`\n[SPIN4ALL:GOV] 🧪  SOLICITAÇÃO DE FLUSH LOCAL: ${executionId}`);
      
      const { BoltRunner } = await GovernanceController._getEngine();
      const runner = new BoltRunner();
      
      const result = await runner.flushDraftToWorkspace(executionId);
      
      res.status(200).json({
        success: true,
        message: 'Mudanças aplicadas ao workspace local. Recarregue a página para ver!',
        workspacePath: result.workspacePath
      });
    } catch (err) {
      console.error(`❌ [GOV:FLUSH_ERR]`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * CLEAN: Remove todos os patches (.bolt-patch) do workspace local.
   */
  async cleanLocalPatches(req, res) {
    try {
      console.log(`\n[SPIN4ALL:GOV] 🧹 SOLICITAÇÃO DE LIMPEZA DE PATCHES LOCAIS`);
      
      const { BoltRunner } = await GovernanceController._getEngine();
      const runner = new BoltRunner();
      
      const result = await runner.cleanWorkspacePatches();
      
      res.status(200).json({
        success: true,
        message: 'Patches de pré-visualização removidos. O site voltou ao estado original.',
        removed: result.removed
      });
    } catch (err) {
      console.error(`❌ [GOV:CLEAN_ERR]`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Obtém os logs "vivos" de um Job via BullMQ.
   */
  async getMissionLogs(req, res) {
    const { jobId } = req.params;
    try {
        const { QueueService } = await GovernanceController._getEngine();
        const job = await QueueService.queue.getJob(jobId);
        
        if (!job) return res.status(404).json({ success: false, error: 'JOB_NOT_FOUND' });

        const logs = await QueueService.queue.getJobLogs(jobId);
        res.status(200).json({ success: true, logs: logs.logs || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
  },

  /**
   * Serve arquivos da Sandbox para o Preview Visual.
   */
  async getSandboxPreview(req, res) {
    const { missionId } = req.params;
    const filePath = req.query.path || 'index.html';

    try {
        const { content, mime } = await PreviewService.getFile(missionId, filePath);
        res.set('Content-Type', mime);
        res.send(content);
    } catch (err) {
        console.error(`❌ [PREVIEW:ERR]`, err.message);
        res.status(err.message === 'FILE_NOT_FOUND' ? 404 : 500).send(err.message);
    }
  }
};

module.exports = GovernanceController;
