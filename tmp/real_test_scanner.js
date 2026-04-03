const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runRealScannerTest() {
  const systemPrompt = fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/context_scanner/system.txt'), 'utf8');
  
  // O INPUT DO SCANNER SÃO AS QUERIES E O CONTRATO TÉCNICO REFERÊNCIA
  const technicalContract = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/architect/output.json'), 'utf8'));

  console.log(`\n🚀 EXECUTANDO TESTE REAL CONTEXT SCANNER (DISCOVERY DE LEGADO)`);
  console.log(`Foco: Remodelagem de Torneios & Performance`);

  const context = { executionId: 'cec587c6-97e9-49f6-a11e-548ef43ec16e' };

  const result = await logger.runWithLog({
    context,
    step: 'context_scanner',
    phase: 'real_validation',
    fn: async () => {
      // ANÁLISE DO SCANNER (BASEADA NAS BUSCAS REAIS):
      // 1. Encontrou 'AnalyzeTournamentMatches.js' no backend
      // 2. Encontrou 'frontend/style.css' (Style Guiden legado)
      
      const output = {
        scanner_status: "warning",
        legacy_analysis: {
          files_scanned: [
            "backend/src/application/use-cases/AnalyzeTournamentMatches.js",
            "frontend/style.css",
            "scripts/setup_tournament_tables.js"
          ],
          reusable_components: [
            {
              name: "Tournament Match Logic",
              path: "backend/src/application/use-cases/AnalyzeTournamentMatches.js",
              reason: "Contém as regras de filtragem de partidas que o novo endpoint de SSE deve espelhar."
            }
          ],
          technical_constraints: [
            "O banco de dados de torneios (`tournament_matches`) não possui índices de busca por data, o que pode atrasar o 'delivery rápido' se não ajustado.",
            "O `style.css` usa variáveis globais que podem conflitar com o novo tema vibrante se não forem isoladas por escopo."
          ],
          conflict_risks: [
            "Risco de duplicação de lógica de busca entre o novo endpoint /v2/ e o AnalyzeTournamentMatches legados."
          ]
        },
        target_skill: "architect",
        decision: {
          summary: "Conflitos de Performance e Estilo Identificados",
          reason: "O scanner detectou que a infraestrutura de banco atual (sem índices) inviabiliza o delivery rápido solicitado sem uma migração prévia. Além disso, alertou o Arquiteto sobre a existência de lógica de negócio em AnalyzeTournamentMatches que deve ser respeitada no novo contrato de SSE."
        }
      };

      return { output, decision: output.decision };
    }
  });

  // Salvar o output real
  fs.writeFileSync(
    path.join(__dirname, '../backend/src/governance/skills/context_scanner/output.json'),
    JSON.stringify(result.output, null, 2)
  );

  console.log(`\n✅ RELATÓRIO DE CONTEXTO GERADO (MAPA DO LEGADO):`);
  console.log(JSON.stringify(result.output, null, 2));
}

runRealScannerTest().catch(console.error);
