const fs = require('fs').promises;
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runStressTest(scenarioName, userInput) {
  console.log(`\n🔥 STRESS TEST: ${scenarioName}`);
  
  const context = logger.createExecutionContext();
  
  const result = await logger.runWithLog({
    context,
    step: 'classifier',
    phase: 'stress_test',
    fn: async () => {
      let intent = 'unknown';
      let domain = 'unknown';
      let complexity = 'low';
      let target_skill = 'none';
      let summary = '';
      let reason = '';

      // SIMULAÇÃO DA INTELIGÊNCIA FUSION v1.1
      const input = userInput.toLowerCase();

      if (input.includes('cor') && input.includes('banco') || (input.includes('header') && input.includes('rota'))) {
        intent = 'fullstack_change';
        domain = 'fullstack';
        complexity = 'high';
        target_skill = 'po';
        summary = 'Multidomain task detected';
        reason = 'User requested both UI changes and Backend/Logic changes in the same input, triggering Fullstack mode.';
      } else if (input.length > 300) {
        intent = 'analysis';
        domain = 'unknown';
        complexity = 'medium';
        target_skill = 'po';
        summary = 'Large input analysis';
        reason = 'Input size suggests a complex requirement or a request for code analysis.';
      } else if (input.includes('function') || input.includes('const') || input.includes('=>')) {
        intent = 'analysis';
        domain = 'unknown';
        complexity = 'medium';
        target_skill = 'po';
        summary = 'Code analysis detected';
        reason = 'User provided code snippets, which typically requires analysis/review before action.';
      } else if (input.includes('banana') || input.includes('elefante')) {
        intent = 'invalid';
        domain = 'unknown';
        complexity = 'low';
        target_skill = 'none';
        summary = 'Nonsense input';
        reason = 'Input does not match any development or governance semantic patterns.';
      } else if (input.includes('melhor') && input.includes('ajuste')) {
        intent = 'question';
        domain = 'unknown';
        complexity = 'medium';
        target_skill = 'none';
        summary = 'Highly ambiguous request';
        reason = 'Request is missing specific action points; it is a general suggestion without a technical target.';
      }

      return {
        input: { user_input: userInput },
        output: { intent, domain, complexity, target_skill, confidence: 0.75 },
        decision: { summary, reason }
      };
    }
  });

  console.log(`📡 Intent: ${result.output.intent} | Complexity: ${result.output.complexity}`);
  console.log(`📝 Reason: ${result.decision.reason}`);
}

async function main() {
  await runStressTest('Cenário A: Contradição UI+BE', 'Mude a cor do botão para verde, mas só altere a rota no banco de dados.');
  await runStressTest('Cenário B: Ambiguidade Abstrata', 'Eu quero que você ajuste tudo o que for necessário para que o sistema fique melhor.');
  await runStressTest('Cenário C: Input de Código (Analysis)', 'const sum = (a, b) => a + b; O que tem de errado aqui?');
  await runStressTest('Cenário D: Nonsense (Invalid)', 'Banana azul elefante voador navegando no CSS.');
  await runStressTest('Cenário E: Multitask Volumoso', 'Preciso que você altere o tamanho do card do dashboard, crie uma tabela de logs no postgres, verifique se o redis está conectado e no final me diga se o protocolo BOLT suporta isso tudo.');
}

main().catch(console.error);
