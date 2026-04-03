/**
 * Intent Mediator BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/services/. 🛡️🌉
 */

const path = require('path');
const newMediatorPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'services', 'intent-mediator.js');
const IntentMediator = require(newMediatorPath);

console.log(`[SPIN4ALL:BRIDGE] 🧠 Intent Mediator Redirecting to: ${newMediatorPath}`);
module.exports = IntentMediator;
