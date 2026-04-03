/**
 * BOLT: Test E2E Smoke (The Flight Test v1.0)
 * 
 * Executa o fluxo completo do BOLT em modo determinístico:
 * Deliberação -> Execução -> Promoção.
 * 🧬🏗️⚡⚙️🛡️
 */

const BoltRunner = require('../backend/src/governance/bolt-runner');
const deterministicSkills = require('../backend/src/governance/skills/deterministic-skills');

async function initiateFlightTest() {
  console.log(`\n========================================`);
  console.log(`🛫 [BOLT:FLIGHT_TEST] Starting Smoke Test...`);
  console.log(`========================================\n`);

  const runner = new BoltRunner(deterministicSkills);
  
  try {
    const userInput = "Crie um arquivo de estilos glassmorphism elite.";
    const result = await runner.run(userInput);

    console.log(`\n========================================`);
    console.log(`🛬 [BOLT:SUCCESS] Flight landed safely!`);
    console.log(`----------------------------------------`);
    console.log(`Execution ID: ${result.executionId}`);
    console.log(`Status: ${result.status}`);
    console.log(`Promotion Log: ${JSON.stringify(result.result.details)}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error(`\n❌ [BOLT:CRASH] Flight failed:`, err.message);
    process.exit(1);
  }
}

initiateFlightTest();
