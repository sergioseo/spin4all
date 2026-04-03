/**
 * Promote Engine BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/services/promote-service.js. 🛡️🌉
 */

const path = require('path');
const newPromotePath = path.join(__dirname, '..', '..', '..', 'bolt-engine-core', 'services', 'promote-service.js');
const PromoteEngine = require(newPromotePath);

console.log(`[SPIN4ALL:BRIDGE] 🏗️ Promote Engine Redirecting to BOLT Engine...`);
module.exports = PromoteEngine;
 stone
