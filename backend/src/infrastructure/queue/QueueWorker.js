const { Worker } = require('bullmq');
const path = require('path');
const connection = require('../redis');
const ProcessMonitor = require('../../services/governance/ProcessMonitor');
const ETLEngine = require('../../services/data/transformation/ETLEngine');

// --- INTEGRAÇÃO BOLT ENGINE (INDUSTRIALIZED) ---
// Resolvemos o caminho para o motor BOLT
const BOLT_ROOT = path.resolve(__dirname, '../../../../../bolt-engine-core');
const BOLT_RUNNER_PATH = path.join(BOLT_ROOT, 'bolt-runner');
const BOLT_SKILLS_PATH = path.join(BOLT_ROOT, 'skills', 'deterministic-skills');

/**
 * Worker Global do Spin4All (Orquestração + Governança)
 * Processa todos os jobs vindos das filas e reporta para a governança. 🛡️🛰️
 */
const startWorkers = () => {
    console.log('👷 [WORKER:INIT] Iniciando processadores de orquestração...');

    // 1. Worker de Orquestração Interna (Site/ETL)
    const mainWorker = new Worker('main_orchestrator', async (job) => {
        const { name } = job;
        console.log(`🚀 [JOB:CORE] Processando: ${name} (ID: ${job.id})`);

        const processId = await ProcessMonitor.start(name, 'Internal Queue');

        try {
            switch (name) {
                case 'ETL_MATCHES':
                    await ETLEngine.processMatches();
                    break;
                case 'AI_ANALYSIS':
                    console.log('🤖 [AI] Análise de IA em fila...');
                    break;
                default:
                    console.warn(`⚠️ [JOB:WARN] Desconhecido: ${name}`);
            }
            await ProcessMonitor.finish(processId, 'SUCCESS', { job_id: job.id });
        } catch (err) {
            console.error(`❌ [JOB:ERR]`, err);
            await ProcessMonitor.finish(processId, 'FAIL', { error: err.message });
            throw err;
        }
    }, { connection });

    // 2. Worker de Governança BOLT (O Motor Inteligente)
    // Este worker ouve a fila 'governance_queue' e executa o BoltRunner
    console.log('👷 [WORKER:BOLT] Integrando Motor de Governança Autônomo...');
    
    const boltWorker = new Worker('governance_queue', async (job) => {
        const { executionId, input } = job.data;
        console.log(`\n📦 [BOLT:WORKER] Missão Detectada! Job #${job.id} (Ref: ${executionId})`);
        
        try {
            // Lazy load do Motor BOLT para evitar overhead se não usado
            const BoltRunner = require(BOLT_RUNNER_PATH);
            const skills = require(BOLT_SKILLS_PATH);
            
            const runner = new BoltRunner(skills);
            const result = await runner.run(input, executionId, job);
            
            console.log(`✅ [BOLT:WORKER] Missão concluída com sucesso (Job #${job.id}).`);
            return result;
        } catch (err) {
            console.error(`❌ [BOLT:WORKER] Erro na missão #${job.id}:`, err.message);
            throw err;
        }
    }, { 
        connection,
        concurrency: 1 // Governança é atômica e sequencial por natureza
    });

    // EVENTOS GLOBAIS
    [mainWorker, boltWorker].forEach(w => {
        w.on('completed', (job) => console.log(`[QUEUE] Job ${job.id} finalizado.`));
        w.on('failed', (job, err) => console.error(`[QUEUE] ALERTA! Job ${job?.id} falhou: ${err.message}`));
    });

    console.log('✨ [WORKERS] Orquestração e Governança operando em harmonia.');
};

module.exports = { startWorkers };
