/**
 * Orchestrator Executor BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/orchestrators/. 🛡️🌉
 */

const path = require('path');
const newExecutorPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'orchestrators', 'orchestrator-executor.js');
const OrchestratorExecutor = require(newExecutorPath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ Orchestrator Executor Redirecting to: ${newExecutorPath}`);
module.exports = OrchestratorExecutor;
 stone
