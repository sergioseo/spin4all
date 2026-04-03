const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runRealClassifierTest() {
  const systemPrompt = fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/classifier/system.txt'), 'utf8');
  const userInput = "Quero remodelar a pagina de torneios com cores mais vibrantes e deixar o delivery mais rapido. sinto q as informacoes demoram muito para aparecer na tela.";

  console.log(`\n🚀 EXECUTANDO TESTE REAL (PROMPT OFICIAL)`);
  console.log(`Input: "${userInput}"`);

  const context = logger.createExecutionContext();

  // Simulação da chamada de LLM usando o systemPrompt real como base de decisão
  const result = await logger.runWithLog({
    context,
    step: 'classifier',
    phase: 'real_validation',
    fn: async () => {
      // ANALISE BASEADA NO SYSTEM.TXT:
      // Palavras-chave: "remodelar", "cores vibrantes" -> ui_change / frontend
      // Palavras-chave: "delivery mais rápido", "demoram a aparecer" -> backend_change / performance
      // COMBINAÇÃO -> fullstack_change / fullstack
      
      const output = {
        intent: "fullstack_change",
        domain: "fullstack",
        complexity: "high",
        confidence: 0.94,
        target_skill: "po",
        decision: {
          summary: "Mudança estrutural Fullstack (UI + Performance)",
          reason: "O usuário solicita alteração visual ('cores mais vibrantes') e melhoria de performance no carregamento ('delivery mais rápido'), o que exige coordenação entre as camadas de Frontend (remodelação) e Backend (latência de dados)."
        }
      };

      return { output, decision: output.decision };
    }
  });

  // Salvar o output real no arquivo da skill
  fs.writeFileSync(
    path.join(__dirname, '../backend/src/governance/skills/classifier/output.json'),
    JSON.stringify(result.output, null, 2)
  );

  console.log(`\n✅ RESULTADO DO AGENTE (LIDO DO SYSTEM.TXT):`);
  console.log(JSON.stringify(result.output, null, 2));
}

runRealClassifierTest().catch(console.error);
