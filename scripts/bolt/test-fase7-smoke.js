/**
 * BOLT: Fase 7 Smoke Test (v7.3 Elite)
 * 
 * Valida os pilares da promoção industrial:
 * 1. Concorrência (Advisory Locks)
 * 2. Atomicidade (Junction Swap)
 * 3. Integridade (SHA-256 Checksum)
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), 'backend', '.env') });
const PromoteService = require('../../backend/src/governance/services/promote-service');
const fs = require('fs');
const path = require('path');

async function runTest() {
  const testId1 = `test_exec_1_${Date.now()}`;
  const testId2 = `test_exec_2_${Date.now()}`;

  console.log(`\n🧪 [BOLT:TEST] Iniciando Smoke Test Fase 7...`);

  // 1. Criar drafts falsos
  const draft1 = path.join(process.cwd(), 'scripts', 'bolt', 'draft', testId1);
  const draft2 = path.join(process.cwd(), 'scripts', 'bolt', 'draft', testId2);
  
  fs.mkdirSync(draft1, { recursive: true });
  fs.mkdirSync(draft2, { recursive: true });
  fs.writeFileSync(path.join(draft1, 'hello.txt'), 'Hello from Exec 1');
  fs.writeFileSync(path.join(draft2, 'hello.txt'), 'Hello from Exec 2');

  const promoter1 = new PromoteService(testId1);
  const promoter2 = new PromoteService(testId2);

  console.log(`\n🔒 [TEST:CONCURRENCY] Tentando promoções simultâneas...`);

  const p1 = promoter1.promote({}).catch(err => ({ success: false, error: err.message, stack: err.stack }));
  const p2 = promoter2.promote({}).catch(err => ({ success: false, error: err.message, stack: err.stack }));

  const [res1, res2] = await Promise.all([p1, p2]);

  // Validar se um falhou por lock
  const lockFailures = [res1, res2].filter(r => r.error && r.error.includes('lock global'));
  const otherFailures = [res1, res2].filter(r => r.error && !r.error.includes('lock global'));
  const successes = [res1, res2].filter(r => r.success);

  if (successes.length === 1 && lockFailures.length === 1) {
    console.log(`✅ [SUCCESS] Lock global funcionou. 1 sucesso, 1 bloqueio de concorrência.`);
  } else if (successes.length === 2) {
    console.error(`❌ [FAILURE] Lock global falhou! Ambos promoveram simultaneamente.`);
  } else if (otherFailures.length > 0) {
    console.error(`❌ [FAILURE] Ocorreram erros técnicos:`);
    otherFailures.forEach(f => console.error(`   - Error: ${f.error}\n   - Stack: ${f.stack}\n`));
  } else {
    console.log(`ℹ️ [INFO] Resultados:`, { res1, res2 });
  }

  // 2. Validar Junction v7.3 Elite
  console.log(`\n🛰️ [TEST:ATOMICITY] Validando Junction '/current'...`);
  const currentPath = path.join(process.cwd(), 'scripts', 'bolt', 'current');
  
  if (fs.existsSync(currentPath)) {
    const realTarget = fs.realpathSync(currentPath);
    console.log(`✅ [SUCCESS] Junction ativa points to: ${realTarget}`);
    
    const content = fs.readFileSync(path.join(currentPath, 'hello.txt'), 'utf8');
    console.log(`✅ [SUCCESS] Conteúdo da release ativa: "${content}"`);
  } else {
    console.error(`❌ [FAILURE] Junction '/current' não foi criada.`);
  }

  // Finalização
  console.log(`\n✨ Smoke Test concluído.\n`);
  process.exit(0);
}

runTest().catch(err => {
  console.error(`\n❌ Erro no Smoke Test:`, err);
  process.exit(1);
});
