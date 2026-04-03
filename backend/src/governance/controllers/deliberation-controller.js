/**
 * Deliberation Controller BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/controllers/. 🛡️🌉
 */

const path = require('path');
const newControllerPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'controllers', 'deliberation-controller.js');
const DeliberationController = require(newControllerPath);

console.log(`[SPIN4ALL:BRIDGE] ⚖️ Deliberation Controller Redirecting to: ${newControllerPath}`);
module.exports = DeliberationController;
