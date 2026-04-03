/**
 * Agent Controller BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/. 🛡️🌉
 */

const path = require('path');
const newControllerPath = path.join(__dirname, '..', '..', '..', 'bolt-engine-core', 'utils', 'validator-bolt.js');
const AgentController = require(newControllerPath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ Agent Controller Redirecting to: ${newControllerPath}`);
module.exports = AgentController;
