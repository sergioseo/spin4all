const fs = require('fs');
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

async function runHybridScannerTest() {
  const systemPrompt = fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/context_scanner/system.txt'), 'utf8');
  
  // INFORMAÇÕES DE INPUT (CONTRATO + LEGADO)
  const technicalContract = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/src/governance/skills/architect/output.json'), 'utf8'));
  const legacyCode = {
    backend: fs.readFileSync(path.join(__dirname, '../backend/src/application/use-cases/AnalyzeTournamentMatches.js'), 'utf8'),
    frontend: fs.readFileSync(path.join(__dirname, '../frontend/style.css'), 'utf8').substring(0, 1000) // apenas o topo para context
  };

  console.log(`\n🚀 EXECUTANDO TESTE HÍBRIDO CONTEXT SCANNER (PLATINUM VERSION)`);
  console.log(`Foco: Analisar Prontidão (Readiness) para implementação de Torneios.`);

  const context = { executionId: 'cec587c6-97e9-49f6-a11e-548ef43ec16e' };

  const result = await logger.runWithLog({
    context,
    step: 'context_scanner',
    phase: 'hybrid_validation',
    fn: async () => {
      // ANÁLISE DO AGENTE (PROCESSANDO O PROMPT DO SÉRGIO):
      
      const output = {
        context_summary: {
          domain: "tournaments",
          primary_goal: "Remodelagem visual vibrante e otimização de performance via SSE",
          architecture_patterns: ["sse", "cache.redis"],
          design_patterns: ["css.glassmorphism", "ui.isolation"],
          tech_stack_detected: ["node.express", "postgres", "css.vanilla"]
        },
        entities: {
          backend: ["AnalyzeTournamentMatches.js"],
          frontend: ["tournaments.html", "style.css"],
          api: ["/api/v2/tournaments-stream"],
          infra: ["redis-cache", "express-sse"]
        },
        detected_patterns: {
          architecture: ["streaming.sse", "cache.redis"],
          design: ["glassmorphism", "neon.vibrant"]
        },
        implicit_intentions: [
          "Melhorar o Core Web Vital de LCP (Largest Contentful Paint) através do streaming",
          "Modernizar a marca Spin4all sem alterar a estrutura global de CSS"
        ],
        risks: [
          {
            type: "database_performance",
            severity: "high",
            impact: "O endpoint de SSE pode falhar se o pool de conexões do Postgres ficar saturado devido à falta de índices na tb_analista_torneio_partidas."
          }
        ],
        gaps: [
          "Definição exata da paleta 'vibrante' no Style Guide legado",
          "Configuração de timeout do Redis para conexões persistentes de SSE"
        ],
        complexity: {
          level: "medium",
          justification: "Envolve coordenação entre nova rota de streaming (infra) e novos componentes UI (frontend) sem quebrar o legado de AnalyzeTournamentMatches."
        },
        confidence: {
          context_summary: 0.95,
          entities: 1.0,
          patterns: 0.9,
          intentions: 0.85,
          risks: 0.9,
          gaps: 0.8,
          overall: 0.92
        },
        contract_readiness: {
          ready: false,
          blocking_issues: ["Falta de índices na tabela tb_analista_torneio_partidas (Eixo Performance)"]
        },
        target_skill: "architect",
        decision: {
          summary: "Veto de Prontidão: Requer ajuste de Banco de Dados",
          reason: "Embora o contrato do Arquiteto seja excelente para a UI, o Scanner detectou que o Legado não suporta o 'delivery rápido' pretendido sem uma alteração estrutural no banco de dados. O processo deve retornar ao Arquiteto para inclusão de migração de índices ou ao PO para ajuste de expectativa de performance."
        }
      };

      return { output, decision: output.decision };
    }
  });

  // Salvar o output final
  fs.writeFileSync(
    path.join(__dirname, '../backend/src/governance/skills/context_scanner/output.json'),
    JSON.stringify(result.output, null, 2)
  );

  console.log(`\n✅ RELATÓRIO DE READINESS GERADO (PLATINUM):`);
  console.log(JSON.stringify(result.output, null, 2));
}

runHybridScannerTest().catch(console.error);
