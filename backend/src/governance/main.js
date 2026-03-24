const AgentController = require('./agent-controller');
const DiffEngine = require('./diff-engine');
const PromoteEngine = require('./promote');
const TestRunner = require('./test-runner');
const logger = require('./utils/logger');
const path = require('path');

/**
 * SPIN4ALL - Governance Main Orchestrator 10.1
 * Ponto de entrada para execução de tarefas do agente com guarda-costas.
 */

async function main(agentActionFn) {
    const controller = new AgentController();
    const diffEngine = new DiffEngine();

    // 0. Iniciar Execução (Gera ID de Log)
    const executionId = controller.startExecution();

    try {
        // 1. Executa a Ação do Agente (Simulado como uma função aqui)
        logger.info('Executando ação do agente...', { executionId });
        await agentActionFn();

        // 2. Detectar Mudanças
        const changedFiles = controller.getChangedFiles();
        logger.info(`Arquivos alterados detectados: ${changedFiles.length}`, { executionId, files: changedFiles });

        if (changedFiles.length === 0) {
            logger.info('Nenhuma mudança detectada. Encerrando.', { executionId });
            return { status: 'NO_CHANGES' };
        }

        // 3. Validar Escopo (Camada 1: Arquivos)
        const scopeValidation = controller.validateScope(changedFiles);
        if (!scopeValidation.success) {
            logger.error('VIOLAÇÃO DE ESCOPO', { executionId, reason: scopeValidation.reason });
            return { status: 'BLOCKED', reason: scopeValidation.reason };
        }

        // 4. Analisar Diff (Camada 2: Conteúdo Semântico)
        logger.info('Analisando impacto semântico das mudanças...', { executionId });
        const analysis = diffEngine.analyzeFiles(changedFiles);
        const rulesValidation = diffEngine.enforceRules(analysis, controller.manifest);

        if (rulesValidation.status === 'BLOCKED') {
            logger.error('VIOLAÇÃO DE REGRA SEMÂNTICA', { executionId, reason: rulesValidation.reason });
            return { status: 'BLOCKED', reason: rulesValidation.reason };
        }

        // 5. Pipeline de Testes Automáticos (Eixo 3)
        logger.info('Iniciando Pipeline de Testes Automáticos no /draft...', { executionId });
        const tester = new TestRunner();
        const testResults = await tester.runAll(controller.manifest.required_tests);

        if (!testResults.success) {
            logger.error('FALHA NOS TESTES', { executionId, reason: testResults.reason });
            return { status: 'BLOCK_TESTS', reason: testResults.reason, details: testResults.details };
        }

        // 6. Promoção Transacional (Eixo 2)
        logger.info('Iniciando promoção transacional para /prod...', { executionId });
        const promoter = new PromoteEngine();
        const promotion = await promoter.run();

        if (!promotion.success) {
            logger.error('FALHA NA PROMOÇÃO', { executionId, reason: promotion.reason });
            return { status: 'BLOCK_PROMOTION', reason: promotion.reason };
        }

        logger.info('✅ Governança e Promoção concluídas com sucesso!', { executionId, hash: promotion.hash });
        return { status: 'SUCCESS', executionId, hash: promotion.hash };

    } catch (err) {
        console.log(`[GOVERNANCE] Ativando Protocolo TICO...`);
        console.error('[MAIN] Erro fatal na orquestração:', err.message);
        return { status: 'ERROR', error: err.message };
    }
}

// Export para uso em scripts de execução
module.exports = main;
