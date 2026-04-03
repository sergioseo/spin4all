/**
 * Test Runner BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo toolkit operacional tico-toolkit-ops/. 🛡️🌉
 */

const path = require('path');
const newTestPath = path.join(__dirname, '..', '..', '..', 'tico-toolkit-ops', 'services', 'qa-validator', 'core.js');
const TestRunner = require(newTestPath);

console.log(`[SPIN4ALL:BRIDGE] 🧪 Test Runner Redirecting to TICO Ops...`);
module.exports = TestRunner;
 stone
