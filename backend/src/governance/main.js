/**
 * Governance Main BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/bolt-runner.js. 🛡️🌉
 */

const path = require('path');
const newRunnerPath = path.join(__dirname, '..', '..', '..', 'bolt-engine-core', 'bolt-runner.js');
const BoltRunner = require(newRunnerPath);

// O main.js antigo exportava uma função que recebia uma agentActionFn.
// O BoltRunner moderno esperauserInput. Mapeamos para compatibilidade.
async function legacyMainBridge(agentActionFn) {
    console.log(`[SPIN4ALL:BRIDGE] 🛰️ Legacy Main Redirecting to BOLT Engine...`);
    const runner = new BoltRunner();
    return await runner.run({ action: 'legacy_execution', detail: 'Triggered from legacy main.js' });
}

module.exports = legacyMainBridge;
 stone
