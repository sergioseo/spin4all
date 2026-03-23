const QueueManager = require('../../src/infrastructure/queue/QueueManager');

async function run() {
    try {
        console.log('📡 [CLI] Enfileirando Job: ETL_MATCHES...');
        await QueueManager.addJob('main_orchestrator', 'ETL_MATCHES', { source: 'CLI' });
        console.log('✅ [CLI] Job enfileirado com sucesso. Verifique o Dashboard.');
        process.exit(0);
    } catch (err) {
        console.error('❌ [CLI] Falha ao enfileirar job:', err);
        process.exit(1);
    }
}

run();
