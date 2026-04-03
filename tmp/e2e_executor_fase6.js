/**
 * E2E TEST - Orchestrator Executor (Fase 6 - Mock DB Mode)
 * 
 * Valida o fluxo de execução sem banco de dados.
 * Substitui o GovernanceRepository por um mock em memória.
 */

// Mock do GovernanceRepository para ambientes sem Postgres
const MockRepo = {
  _store: {},
  async createExecution(id) { this._store[id] = { step: 0, status: 'pending', logs: [] }; },
  async acquireLock(id) { this._store[id].locked = true; return true; },
  async renewLock(id) { this._store[id].last_heartbeat = Date.now(); },
  async releaseLock(id) { this._store[id].locked = false; },
  async updateExecutionStep(id, step, status, log, checkpoint) {
    this._store[id].step = step;
    this._store[id].status = status;
    this._store[id].logs.push(log);
    if (checkpoint) { this._store[id].checkpoints = [...(this._store[id].checkpoints || []), checkpoint]; }
  },
  async completeExecution(id, finalStatus) { this._store[id].status = finalStatus; },
  dump(id) { return this._store[id]; }
};

// Patch do módulo antes de exigir o executor
jest = undefined; // Evita confusão com jest globals
const Module = require('module');
const originalLoad = Module._load;
Module._load = function(request, ...args) {
  if (request.includes('governance-repository')) return MockRepo;
  return originalLoad.call(this, request, ...args);
};

const OrchestratorExecutor = require('./backend/src/governance/orchestrators/orchestrator-executor');

async function runFullE2E() {
  console.log('\n🚀 INICIANDO TESTE E2E - ORCHESTRATOR EXECUTOR (MOCK DB)\n');

  const manifest = {
    execution_id: 'e2e-test-001',
    status: 'converged',
    safe_mode: 'backend_only',
    decision_metrics: { confidence: 0.96, risk_score: 0.1, impact_score: 0.2 },
    impact_scope: {
      files: [
        { path: 'backend/auth.js', change_type: 'modify', estimated_diff_size: 'medium' }
      ],
      services: ['Auth Service'],
      data_changes: []
    },
    execution_plan: {
      steps: [
        {
          order: 1,
          action: 'create_index_users_email',
          scope: 'infrastructure',
          rollback: 'drop_index_users_email',
          retry_policy: { max_attempts: 2, strategy: 'exponential', backoff_ms: 50, retry_on: ['timeout'], abort_on: ['syntax_error'] },
          side_effects: [],
          compensation_guarantee: 'guaranteed'
        },
        {
          order: 2,
          action: 'update_auth_controller',
          scope: 'backend',
          rollback: 'revert_auth_controller',
          retry_policy: { max_attempts: 2, strategy: 'exponential', backoff_ms: 50, retry_on: ['timeout'], abort_on: ['syntax_error'] },
          side_effects: [],
          compensation_guarantee: 'guaranteed'
        }
      ]
    },
    execution_guardrails: { max_files_changed: 10, max_diff_size: 'large', block_on_violation: true }
  };

  const executor = new OrchestratorExecutor(manifest);
  const result = await executor.execute();

  const state = MockRepo.dump(manifest.execution_id);

  console.log('\n============================');
  console.log('✅ RESULTADO FINAL:', result.status.toUpperCase());
  console.log('Current Step:', state.step);
  console.log('Execution Status:', state.status);
  console.log('Steps logged:', state.logs.length);
  console.log(`Logs Steps: ${state.logs.map(l => `[${l.step}] ${l.action} → ${l.status}`).join(' | ')}`);

  if (result.status === 'completed' && state.logs.length === 4) {
    console.log('\n🛡️  E2E ORCHESTRATOR EXECUTOR VALIDADO COM SUCESSO! 🛡️');
  }
}

runFullE2E().catch(console.error);
