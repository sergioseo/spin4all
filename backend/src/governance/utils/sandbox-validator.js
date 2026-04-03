/**
 * Sandbox Validator BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/utils/. 🛡️🌉
 */

const path = require('path');
const newSandboxPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'utils', 'sandbox-validator.js');
const SandboxValidator = require(newSandboxPath);

console.log(`[SPIN4ALL:BRIDGE] 🛡️ Sandbox Validator Redirecting to: ${newSandboxPath}`);
module.exports = SandboxValidator;
