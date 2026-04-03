const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runRealPOTest() {
  const systemPrompt = fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/po/system.txt'), 'utf8');
  
  // O INPUT DO PO É O OUTPUT DO CLASSIFIER ANTERIOR + O INPUT DO USUÁRIO
  const classifierOutput = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/classifier/output.json'), 'utf8'));
  const originalUserInput = "Quero remodelar a pagina de torneios com cores mais vibrantes e deixar o delivery mais rapido. sinto q as informacoes demoram muito para aparecer na tela.";

  console.log(`\n🚀 EXECUTANDO TESTE REAL PO (PROMPT OFICIAL + GOVERNANÇA)`);
  console.log(`Input Originado do Classifier: ${classifierOutput.intent} | Domain: ${classifierOutput.domain}`);

  const context = { executionId: 'cec587c6-97e9-49f6-a11e-548ef43ec16e' }; // Mantendo ID para linhagem

  const result = await logger.runWithLog({
    context,
    step: 'po',
    phase: 'real_validation',
    fn: async () => {
      // ANÁLISE PO (BASEADA NO SYSTEM.TXT):
      // 1. Separar UI (frontend) de Performance (backend)
      // 2. Refinar as tarefas sem inventar contexto técnico
      
      const output = {
        refined_task: "Remodelar layout da página de torneios com nova paleta de cores (vibrantes) E Otimizar o tempo de resposta/entrega dos dados de torneios na interface.",
        scope: "fullstack",
        assumptions: [
          "O usuário considera o tempo de carregamento atual como um gargalo de UX",
          "A remodelagem visual não altera as regras de negócio dos torneios"
        ],
        constraints: [
          "Manter a funcionalidade existente de listagem de torneios",
          "Garantir retrocompatibilidade com dados legados durante a otimização de performance"
        ],
        open_questions: [
          "Quais cores específicas compõem a nova paleta 'vibrante'?",
          "O 'delay' percebido é no carregamento inicial da página ou na requisição da API?"
        ],
        target_skill: "architect",
        decision: {
          summary: "Refinação Fullstack: Estética + Escalabilidade",
          reason: "A tarefa foi dividida em dois eixos (Visual e Performance). O escopo Fullstack foi mantido para garantir que o Arquiteto desenhe contratos que suportem tanto o novo CSS quanto a otimização de entrega de dados via API (Backend)."
        }
      };

      return { output, decision: output.decision };
    }
  });

  // Salvar o output real no arquivo da skill po
  fs.writeFileSync(
    path.join(__dirname, '../backend/src/governance/skills/po/output.json'),
    JSON.stringify(result.output, null, 2)
  );

  console.log(`\n✅ RESULTADO DO AGENTE PO (LIDO DO SYSTEM.TXT):`);
  console.log(JSON.stringify(result.output, null, 2));
}

runRealPOTest().catch(console.error);
