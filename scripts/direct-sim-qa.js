/**
 * BOLT: Direct Inject Simulation (v9.8 Elite)
 * 
 * Simula uma falha de governança gerada pela IA (SQL sem WHERE).
 * Objetivo: Validar que o QA v9.8 bloqueia o arquivo perigoso.
 * 🧪🔬🏁
 */

const QAValidator = require('../backend/src/governance/services/qa-validator/core');
const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

const EXECUTION_ID = 'sim-safety-fail-98';
const DRAFT_DIR = path.join(__dirname, 'bolt', 'draft', EXECUTION_ID);

async function runDirectSim() {
  console.log('========================================');
  console.log('🛫 [BOLT:SIMULATION] Starting Direct Inject Mission...');
  console.log('💬 Scenario: "Deletar foto do perfil" (Simulando erro da IA)');
  console.log('========================================\n');

  // 1. Preparar o "erro" no rascunho
  if (!fs.existsSync(DRAFT_DIR)) fs.mkdirSync(DRAFT_DIR, { recursive: true });
  
  // A IA "esqueceu" o WHERE - Risco crítico de deletar fotos de TODOS os usuários
  const dangerousSQL = `UPDATE users SET photo = NULL;`; 
  fs.writeFileSync(path.join(DRAFT_DIR, 'profile-cleanup.sql'), dangerousSQL);
  console.log('⚔️  [STAGE 2] IA Generated Dangerous SQL in Draft...');

  // 2. Acionar o QA Validator v9.8
  const qa = new QAValidator(EXECUTION_ID);
  console.log('🛡️  [STAGE 2.5] QA Health Check Engine Activated...');
  
  const results = await qa.validateDrafts({ status: 'executing' }, DRAFT_DIR);
  
  // Persistir log de auditoria
  await logger.logQAHealthCheck({ execution_id: EXECUTION_ID, results: { ...results, version: qa.version } });

  // 3. Resultado Final
  console.log('\n========================================');
  console.log(`🏁 [MISSION RESULT] Overall Score: ${results.overall_score.toFixed(2)}`);
  console.log(`🚦 Status: ${results.passed ? 'PASSED ✅' : 'BLOCKED ❌'}`);
  console.log('========================================');

  if (!results.passed) {
    console.log(`🚨 REASON: ${results.error}`);
    results.files[0].violations.forEach(v => console.log(`   ⚠️ Violation: ${v}`));
  }
}

runDirectSim().catch(console.error);
