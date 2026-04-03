/**
 * Promotion Lock BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/utils/. 🛡️🌉
 */

const path = require('path');
const newLockPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'utils', 'promotion-lock.js');
const PromotionLock = require(newLockPath);

console.log(`[SPIN4ALL:BRIDGE] 🗝️ Promotion Lock Redirecting to: ${newLockPath}`);
module.exports = PromotionLock;
 stone
