/**
 * BOLT: Interactive Commander Dashboard (v13.6)
 * 
 * Experiência Humano-Cêntrica de Governança.
 * 🛡️👤📋✨
 */

const BoltRunner = require('../backend/src/governance/bolt-runner');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração do Leitor de Terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runInteractiveDashboard() {
  console.log('\n' + '═'.repeat(60));
  console.log(' 🛡️  [BOLT:DASHBOARD] - PAINEL DE COMANDO DE ELITE (v13.6)');
  console.log(' 💬 Input: "Quero que mude minha foto para uma do Brad Pitt"');
  console.log('═'.repeat(60) + '\n');

  // Habilidades de Mock (Audit v2.16 COMPLIANT)
  const mockSkills = {
    scanner: { run: async () => ({ decision: { summary: "Intent Scan", reason: "Standard flow" }, target_skill: "architect", context_summary: "Photo update", entities: ["users"], risks: [], confidence: { overall: 1.0 }, contract_readiness: { ready: true } }) },
    po: { run: async () => ({ decision: { summary: "Approve Task", reason: "Safe domain" }, target_skill: "architect", refined_task: "Update profile_photo", approved: true, confidence: { overall: 1.0 }, scope: "FIELD_LEVEL" }) },
    architect: { 
      run: async () => ({ 
        decision: { summary: "Generating SQL", reason: "Entity migration protocol" },
        target_skill: "executor",
        technical_spec: "SQL Update + Staging Sync",
        intent: "update_profile_photo", 
        action: "UPDATE users SET profile_photo = 'avatar-bp-123.svg' WHERE id = 123;",
        status: "executing",
        impact_scope: { files: [{ path: "semantic-migration.sql", change_type: "CREATE", estimated_diff_size: "5 lines" }], services: ["database"], data_changes: ["photo"] },
        execution_plan: { steps: [{ order: 1, name: "Database Exec", action: "UPDATE users SET profile_photo = 'avatar-bp-123.svg' WHERE id = 123;", scope: "file:semantic-migration.sql" }] }
      }),
      resolve: async () => ({})
    }
  };

  const runner = new BoltRunner(mockSkills);
  
  // 1. INICIAR PIPELINE
  console.log(' 🏗️  [BOLT] Preparando engenharia de Staging...');
  const result = await runner.run("Quero que mude minha foto para uma do Brad Pitt");

  if (result.status === 'awaiting_promotion') {
    const report = result.audit_report;

    console.log('\n' + '─'.repeat(60));
    console.log(' 📋  RESUMO DA MISSÃO (HUMANIZADO)');
    console.log('─'.repeat(60));
    console.log(` 🎯  OBJETIVO:      ${report.mission_summary}`);
    console.log(` 🛡️  CONFIANÇA QA:   ${report.confidence}`);
    console.log(` ⚖️  NÍVEL DE RISCO: ${report.risk_level}`);
    console.log(` ✅  STATUS QA:     ${report.qa_status}`);
    console.log(` 📝  AÇÃO:          ${report.proposed_action}`);
    console.log(` 📦  IMPACTO:       ${report.impact}`);
    console.log('─'.repeat(60));

    console.log('\n 🔒  ESTADO ATUAL: A produção continua protegida (Air-gapped).');
    console.log(' 📂  Release imutável congelada em: ' + path.basename(result.releasePath));
    console.log('─'.repeat(60));

    // ⚡ O GATE HUMANO REAL ⚡
    console.log('\n ❓  Comandante, como deseja proceder?');
    console.log('    [S] SUBIR AGORA (Inicia o Atomic Swap para o site vivo)');
    console.log('    [N] ENVIAR PARA BACKLOG (Estaciona a missão para revisão)');
    
    const answer = await askQuestion('\n 👉 Sua Decisão: ');

    if (answer.toLowerCase() === 's') {
      console.log('\n 🚀 [COMMAND] Iniciando promoção atômica...');
      const finalResult = await runner.approve(result.executionId, result.releasePath);
      
      if (finalResult.status === 'success') {
        console.log('\n 🏆 [SUCCESS] Missão concluída! O site agora está LIVE com a nova versão. ✅');
      }
    } else {
      console.log('\n 🛑 [BACKLOG] Entendido. Movendo arquivos para a fila de Backlog...');
      const rejectResult = await runner.reject(result.executionId, result.releasePath, "Rejeitado para revisão manual posterior.");
      
      if (rejectResult.status === 'rejected') {
        console.log(' ✅ [DONE] Missão estacionada com segurança em /backlog. Nada foi perdido.');
        console.log(' 📂 Acesse em: scripts/bolt/backlog/' + path.basename(result.releasePath));
      }
    }
  }

  rl.close();
}

runInteractiveDashboard().catch(err => {
  console.error(err);
  rl.close();
});
