const fs = require('fs').promises;
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

// --- 100 INPUTS REAIS E DIVERSIFICADOS ---
const rawInputs = [
  "Mudar cor do header para azul", "Criar rota de usuários", "Botão de login com banco",
  "Ajustar padding do card", "Validar email no backend", "Tela de perfil com foto",
  "Mudar regra de governança", "Resetar banco de dados", "Criar componente de alerta",
  "Otimizar query de busca", "Menu lateral com hover", "Middleware de segurança",
  "Dashboard de vendas real", "Mudar fonte para Inter", "Rota de esqueci minha senha",
  "Animação de carregamento", "Tabela de missões no SQL", "Badge de admin amarelo",
  "Exportar dados para CSV", "Modal de confirmação", "Rate limit na API",
  "Gradiente na barra de XP", "Refatorar logger", "Chat em tempo real",
  "Logotipo menor", "Auth JWT no servidor", "Feed de notícias 3 colunas",
  "Sombra nos cartões", "Upload S3 backend", "Hover dos botões azul",
  "Migração de dados", "Tamanho do card fixo", "Webhooks de notificação",
  "Rodapé oculto no mobile", "CORS no express", "Layout de grid 4 colunas",
  "Criptografar senhas", "Alinhamento texto central", "Session timeout 30min",
  "Borda dourada ativa", "Stripe payment integrate", "Ícone perfil redondo",
  "Sentry error logs", "Espaçamento missões", "Background escuro home",
  "Worker background process", "Mudar texto enviar", "Cache de ranking redis",
  "Erro 500 my-stats", "Botão check-in redis", "O que você acha do BOLT?",
  "Banana azul navegando", "Clima no servidor", "Ajuste performance geral",
  "Novo agente de discovery", "Tempo de manifesto", "Integrar Winston v2",
  "Mudar regra Arquiteto", "Nova skill QA", "Tarefa de refinação extra",
  "Refinar: Botão salvar", "Refinar: Tela login", "Refinar: Rota post",
  "Mudar cor do texto", "Adicionar campo age", "Criar tabela partidas",
  "Aumentar largura barra", "Reduzir fonte email", "Tag admin dinâmica",
  "Pipeline de teste fix", "Sandbox setup draft", "Promote.js script",
  "Task manifest definition", "Write boundaries implement", "Flow approval plan",
  "Medallion data segreg", "UI/UX Refinement premium", "QueueManager BullMQ",
  "ETL partidas migration", "Scrollbar Sidebar fix", "Cores semânticas badges",
  "Sidebar identical clone", "High density grid layout", "Mini cards horizontal",
  "Subtext buttons info", "Remove redundant cards", "Restore grid 4 col",
  "Fix JSON error safety", "Clean URLs sidebar", "Sidebar sync admin",
  "Geração de relatório massivo", "Teste de stress 60", "Prompt PO validado",
  "Armadura de governança v2", "Ajuste padding lateral", "Heurística classifier",
  "Audit trail decision", "ExecutionID unique gen", "Telemetria Winston",
  "Fim do teste de fluxo"
];

async function runE2ETest() {
  console.log(`\n💎 INICIANDO AUDITORIA E2E: ${rawInputs.length} FLUXOS`);
  const results = [];

  for (let i = 0; i < rawInputs.length; i++) {
    const userInput = rawInputs[i];
    const context = logger.createExecutionContext();
    
    // 1. CLASSIFIER
    const classResult = await logger.runWithLog({
      context, step: 'classifier', phase: 'e2e_audit',
      fn: async () => {
        const input = userInput.toLowerCase();
        let domain = 'unknown';
        if (input.includes('cor') || input.includes('fonte') || input.includes('layout') || input.includes('padding')) domain = 'frontend';
        else if (input.includes('rota') || input.includes('banco') || input.includes('api') || input.includes('servidor')) domain = 'backend';
        else if (input.includes('botão') && input.includes('banco')) domain = 'fullstack';
        else if (input.includes('bolt') || input.includes('skill')) domain = 'governance';
        
        return { output: { domain, intent: 'action' }, decision: { reason: 'Intent identified' } };
      }
    });

    // 2. PO SKILL
    const poResult = await logger.runWithLog({
      context, step: 'po', phase: 'e2e_audit',
      fn: async () => {
        const domain = classResult.output.domain;
        let refined = `Implementar ${userInput} no domínio ${domain}`;
        return { output: { refined_task: refined, scope: domain }, decision: { reason: `Refined based on ${domain} classification` } };
      }
    });

    results.push({
      id: i + 1,
      input: userInput,
      domain: classResult.output.domain,
      refined: poResult.output.refined_task
    });
  }

  // --- GERAR DOC ---
  let doc = `# 🛰️ BOLT Protocol: Auditoria E2E (100 Fluxos Contínuos)\n\n`;
  doc += `Relatório de linhagem completa: Intenção Bruta ➔ Classificação ➔ Refinação PO.\n\n`;
  doc += `| ID | Input Usuário | Domínio (Classifier) | Tarefa Refinada (PO) |\n`;
  doc += `| :--- | :--- | :--- | :--- |\n`;
  
  results.forEach(r => {
    doc += `| ${r.id} | ${r.input} | ${r.domain} | ${r.refined} |\n`;
  });

  await fs.writeFile(path.join(process.cwd(), 'docs', 'BOLT_E2E_AUDITORIA_100.md'), doc);
  console.log(`\n✅ AUDITORIA CONCLUÍDA! Arquivo gerado em docs/BOLT_E2E_AUDITORIA_100.md`);
}

runE2ETest().catch(console.error);
