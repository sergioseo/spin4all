const { addGovernanceTask } = require('../backend/src/governance/utils/queue-client');
const { v4: uuidv4 } = require('uuid');

async function testDispatch() {
  const executionId = 'async_task_' + uuidv4().slice(0, 8);
  const mockInput = {
    action: 'audit_request',
    detail: 'Teste de isolamento de rede BOLT v1.2'
  };

  console.log(`\n🚀 [TEST:DISPATCH] Enfileirando tarefa: ${executionId}`);
  
  try {
    const job = await addGovernanceTask(executionId, mockInput);
    console.log(`✅ [TEST:SUCCESS] Job enfileirado com ID: ${job.id}`);
    console.log(`💡 Verifique o Terminal 1 para ver o Worker processando esta tarefa.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ [TEST:FAILURE] Erro ao enfileirar:`, err.message);
    process.exit(1);
  }
}

testDispatch();
