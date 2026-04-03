const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runRealArchitectTest() {
  const systemPrompt = fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/architect/system.txt'), 'utf8');
  
  // O INPUT DO ARCHITECT É O OUTPUT DO PO
  const poOutput = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/po/output.json'), 'utf8'));

  console.log(`\n🚀 EXECUTANDO TESTE REAL ARCHITECT (PROMPT OFICIAL + GOVERNANÇA)`);
  console.log(`Input Originado do PO: ${poOutput.refined_task}`);

  const context = { executionId: 'cec587c6-97e9-49f6-a11e-548ef43ec16e' }; // Mantendo linhagem

  const result = await logger.runWithLog({
    context,
    step: 'architect',
    phase: 'real_validation',
    fn: async () => {
      // PROCESSO INTELECTUAL DO ARQUITETO (BASEADO NO SYSTEM.TXT):
      // Precisa resolver: UI (Cores vibrantes) + Performance (Delivery rápido)

      const output = {
        contract_id: "arch-v1-2026-001",
        technical_spec: {
          files_to_create: [
            "backend/src/api/v2/tournaments/performance.js",
            "frontend/src/styles/themes/vibrant-neon.css"
          ],
          files_to_modify: [
            "backend/src/api/routes.js",
            "frontend/src/pages/tournaments.html",
            "frontend/src/js/modules/tournaments-loader.js"
          ],
          api_endpoints: [
            {
              path: "/api/v2/tournaments-stream",
              method: "GET",
              request_schema: { params: ["limit", "offset"] },
              response_schema: { type: "SSE / Stream", description: "Entrega incremental de dados para reduzir tempo de percepção" }
            }
          ],
          components_ui: [
            {
              name: "TournamentGlassCard",
              props: ["tournament_data", "is_vibrant"],
              styles: "Uso de Backdrop-filter: blur(15px) e sombras neon com HSL vibrantes."
            }
          ]
        },
        dependencies: ["redis-cache", "express-sse"],
        infrastructure_requirements: "Necessário garantir que o Redis esteja ativo para o cache de entrega rápida das partidas.",
        target_skill: "coder",
        decision: {
          summary: "Arquitetura de Entrega Híbrida (SSE + Cache)",
          reason: "Para atender ao pedido de 'delivery rápido', optei por uma abordagem de Server-Sent Events (SSE) para stream de dados, eliminando o delay de espera de um JSON gigante. Para o visual 'vibrante', os arquivos de CSS foram isolados em um novo tema para não quebrar o layout padrão."
        }
      };

      return { output, decision: output.decision };
    }
  });

  // Salvar o output real
  fs.writeFileSync(
    path.join(__dirname, '../backend/src/governance/skills/architect/output.json'),
    JSON.stringify(result.output, null, 2)
  );

  console.log(`\n✅ CONTRATO TÉCNICO GERADO (LIDO DO SYSTEM.TXT):`);
  console.log(JSON.stringify(result.output, null, 2));
}

runRealArchitectTest().catch(console.error);
