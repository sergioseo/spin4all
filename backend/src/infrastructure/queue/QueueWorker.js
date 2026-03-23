const { Worker } = require('bullmq');
const connection = require('../redis');
const ProcessMonitor = require('../../services/governance/ProcessMonitor');
const ETLEngine = require('../../services/data/transformation/ETLEngine');

/**
 * Worker Global do Spin4All
 * Processa todos os jobs vindos das filas e reporta para a governança
 */
const startWorkers = () => {
    console.log('👷 [WORKER] Iniciando processadores de orquestração...');

    const mainWorker = new Worker('main_orchestrator', async (job) => {
        const { name, data } = job;
        console.log(`🚀 [JOB] Processando: ${name} (ID: ${job.id})`);

        // Registrar início na Governança
        const processId = await ProcessMonitor.start(name, 'BullMQ Execution');

        try {
            switch (name) {
                case 'ETL_MATCHES':
                    // Chamar a engine real de ETL
                    await ETLEngine.processMatches();
                    break;

                case 'AI_ANALYSIS':
                    // Futuro: Chamar o orquestrador de IA
                    console.log('🤖 [AI] Análise de IA solicitada...');
                    break;

                default:
                    console.warn(`⚠️ [WORKER] Job desconhecido: ${name}`);
            }

            // Reportar sucesso
            await ProcessMonitor.finish(processId, 'SUCCESS', { 
                job_id: job.id,
                triggered_at: new Date().toISOString()
            });

        } catch (err) {
            console.error(`❌ [JOB ERROR] Falha no job ${name}:`, err);
            
            // Reportar falha
            await ProcessMonitor.finish(processId, 'FAIL', { 
                error: err.message, 
                job_id: job.id 
            });
            
            throw err; // Lançar erro para o BullMQ tentar novamente
        }
    }, { connection });

    mainWorker.on('completed', (job) => {
        console.log(`✅ [JOB] Concluído: ${job.name}`);
    });

    mainWorker.on('failed', (job, err) => {
        console.error(`🚨 [JOB] Falhou: ${job.name}. Erro: ${err.message}`);
    });

    return mainWorker;
};

module.exports = { startWorkers };
