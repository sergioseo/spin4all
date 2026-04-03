/**
 * Diff Engine BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo toolkit operacional tico-toolkit-ops/. 🛡️🌉
 */

const path = require('path');
const newEnginePath = path.join(__dirname, '..', '..', '..', 'tico-toolkit-ops', 'services', 'semantic-engine.js');
const DiffEngine = require(newEnginePath);

console.log(`[SPIN4ALL:BRIDGE] 🧠 Diff Engine Redirecting to TICO Ops...`);
module.exports = DiffEngine;
