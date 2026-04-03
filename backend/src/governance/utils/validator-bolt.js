/**
 * BOLT Validator BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/utils/. 🛡️🌉
 */

const path = require('path');
const newValidatorPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'utils', 'validator-bolt.js');
const BoltValidator = require(newValidatorPath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ BOLT Validator Redirecting to: ${newValidatorPath}`);
module.exports = BoltValidator;
