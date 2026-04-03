/**
 * BOLT Runner BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/. 🛡️🌉
 */

const path = require('path');
const newRunnerPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'bolt-runner.js');
const BoltRunner = require(newRunnerPath);

console.log(`[SPIN4ALL:BRIDGE] 🛰️ BOLT Runner Redirecting to: ${newRunnerPath}`);
module.exports = BoltRunner;
 stone
