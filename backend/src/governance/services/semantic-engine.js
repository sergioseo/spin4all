/**
 * BOLT: Semantic Engine (Shim v1.0)
 * 
 * Este arquivo é uma ponte para a nova localização do TICO Toolkit.
 * Não altere este arquivo diretamente; edite em ../../../tico-toolkit-ops/semantic-engine.js
 * 🛡️🌉
 */

const path = require('path');

// Caminho para a nova base operacional do TICO (Inside-Out)
const ticoPath = path.join(__dirname, '..', '..', '..', '..', 'tico-toolkit-ops', 'semantic-engine.js');

module.exports = require(ticoPath);
