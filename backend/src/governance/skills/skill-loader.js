/**
 * Skill Loader BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/skills/. 🛡️🌉
 */

const path = require('path');
const newLoaderPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'skills', 'skill-loader.js');
const SkillLoader = require(newLoaderPath);

console.log(`[SPIN4ALL:BRIDGE] 🧠 Skill Loader Redirecting to: ${newLoaderPath}`);
module.exports = SkillLoader;
