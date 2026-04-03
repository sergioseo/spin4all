const fs = require('fs').promises;
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runTest(scenarioName, userInput) {
  console.log(`\n🚀 Testando: ${scenarioName}`);
  
  const context = logger.createExecutionContext();
  
  // Simulando a execução da Skill Classifier
  const result = await logger.runWithLog({
    context,
    step: 'classifier',
    phase: 'routing',
    fn: async () => {
      // Aqui simulamos a inteligência do agente baseada no system.txt
      let domain = 'unknown';
      let target_skill = 'none';
      let summary = '';
      let reason = '';

      if (userInput.toLowerCase().includes('cor') || userInput.toLowerCase().includes('layout') || userInput.toLowerCase().includes('header')) {
        domain = 'frontend';
        target_skill = 'po';
        summary = 'UI change detected';
        reason = `User mentioned visual elements like "${userInput}", which falls under Frontend domain.`;
      } else if (userInput.toLowerCase().includes('endpoint') || userInput.toLowerCase().includes('api') || userInput.toLowerCase().includes('banco')) {
        domain = 'backend';
        target_skill = 'po';
        summary = 'API/Logic change detected';
        reason = `Request involves server-side structures like "${userInput}", mapping to Backend domain.`;
      } else if (userInput.toLowerCase().includes('protocolo') || userInput.toLowerCase().includes('skill')) {
        domain = 'governance';
        target_skill = 'po';
        summary = 'Protocol update detected';
        reason = `User wants to modify the BOLT protocol or its skills, targeting Governance domain.`;
      } else {
        summary = 'Ambiguous intent';
        reason = 'No clear keywords found to map intent to a specific domain.';
      }

      return {
        input: { user_input: userInput },
        output: { target_skill, domain, confidence: 0.98 },
        decision: { summary, reason }
      };
    }
  });

  console.log(`✅ Resultado: ${result.output.domain} -> ${result.output.target_skill}`);
  console.log(`📝 Justificativa: ${result.decision.reason}`);
  return result;
}

async function main() {
  await runTest('Cenário 1 (Frontend)', 'Quero mudar a cor do header para azul marinho.');
  await runTest('Cenário 2 (Backend)', 'Crie um endpoint para salvar os treinos dos usuários.');
  await runTest('Cenário 3 (Governance)', 'Adicione uma nova skill ao protocolo BOLT para tratar de segurança.');
  await runTest('Cenário 4 (Unknown)', 'Pode me ajudar com uma coisa?');
}

main().catch(console.error);
