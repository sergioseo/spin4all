/**
 * BOLT Logger BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/utils/. 🛡️🌉
 */

const path = require('path');
const newLoggerPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'utils', 'logger-bolt.js');
const BoltLogger = require(newLoggerPath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ BOLT Logger Redirecting to: ${newLoggerPath}`);
module.exports = BoltLogger;
