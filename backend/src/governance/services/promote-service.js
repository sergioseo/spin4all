/**
 * Promote Service BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/services/. 🛡️🌉
 */

const path = require('path');
const newServicePath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'services', 'promote-service.js');
const PromoteService = require(newServicePath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ Promote Service Redirecting to: ${newServicePath}`);
module.exports = PromoteService;
