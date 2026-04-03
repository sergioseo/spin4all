/**
 * Skill Resolver BRIDGE (Shim v2.0)
 * Redireciona chamadas para o novo diretório bolt-engine-core/skills/. 🛡️🌉
 */

const path = require('path');
const newResolverPath = path.join(__dirname, '..', '..', '..', '..', 'bolt-engine-core', 'skills', 'skill-resolver.js');
const SkillResolver = require(newResolverPath);

console.log(`[SPIN4ALL:BRIDGE] 🧠 Skill Resolver Redirecting to: ${newResolverPath}`);
module.exports = SkillResolver;
 stone
