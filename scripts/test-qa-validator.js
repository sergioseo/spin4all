/**
 * BOLT: QA Validator Flight Test (v9.8)
 * 
 * Validação rigorosa dos cenários de governança.
 * 🧪🔬🏁
 */

const QAValidator = require('../backend/src/governance/services/qa-validator/core');
const fs = require('fs');
const path = require('path');

const TEST_DRAFT_DIR = path.join(__dirname, 'bolt', 'draft', 'test-qa-98');

async function runTest() {
  console.log('========================================');
  console.log('🛫 [BOLT:QA_TEST] Starting Flight Test (v9.8)...');
  console.log('========================================\n');

  // Preparar ambiente de teste
  if (!fs.existsSync(TEST_DRAFT_DIR)) fs.mkdirSync(TEST_DRAFT_DIR, { recursive: true });

  const qa = new QAValidator('test-session-98');

  // --- CENÁRIO 1: Sucesso (Elite CSS) ---
  console.log('🔹 Scenario 1: Elite CSS (Success)');
  const cssElite = `
    .premium-card {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  fs.writeFileSync(path.join(TEST_DRAFT_DIR, 'success.css'), cssElite);

  // --- CENÁRIO 2: Auto-Fix (Chave Faltando) ---
  console.log('🔹 Scenario 2: Broken CSS (Auto-Fix expected)');
  const cssBroken = `.broken { color: red; `; // Faltando '}'
  fs.writeFileSync(path.join(TEST_DRAFT_DIR, 'fix-me.css'), cssBroken);

  // --- CENÁRIO 3: Bloqueio Fatal (SQL Perigoso) ---
  console.log('🔹 Scenario 3: Dangerous SQL (Block expected)');
  const sqlDangerous = `UPDATE users SET points = 0;`; // SEM WHERE
  fs.writeFileSync(path.join(TEST_DRAFT_DIR, 'danger.sql'), sqlDangerous);

  // EXECUTAR VALIDAÇÃO
  const results = await qa.validateDrafts({}, TEST_DRAFT_DIR);

  console.log('\n========================================');
  console.log('🏁 [TEST RESULTS] Summary:');
  console.log(`  Overall Score: ${results.overall_score.toFixed(2)}`);
  console.log(`  Passed: ${results.passed ? 'YES ✅' : 'NO ❌'}`);
  console.log('========================================');

  results.files.forEach(f => {
    console.log(`\n📄 File: ${f.path}`);
    console.log(`   Score: ${f.score} | Status: ${f.status}`);
    f.violations.forEach(v => console.log(`   ⚠️ Violation: ${v}`));
  });

  // Verificar se o Auto-Fix funcionou no arquivo fix-me.css
  const fixedContent = fs.readFileSync(path.join(TEST_DRAFT_DIR, 'fix-me.css'), 'utf8');
  if (fixedContent.includes('}')) {
    console.log('\n🪄  [VERIFICATION] Auto-Fix verified for fix-me.css! (Closing brace added)');
  }
}

runTest().catch(console.error);
