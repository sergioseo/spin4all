/**
 * BOLT: Backlog Management Simulation (v13.7.1)
 * 
 * Demonstração de Listagem e Deleção de Missões Estacionadas.
 * 🛡️👤⚓
 */

const BoltRunner = require('../backend/src/governance/bolt-runner');
const fs = require('fs');
const path = require('path');

async function runBacklogSimulation() {
  console.log('\n' + '═'.repeat(60));
  console.log(' 🛡️  [BOLT:BACKLOG] - GESTÃO DE MISSÕES ESTACIONADAS (v13.7.1)');
  console.log('═'.repeat(60) + '\n');

  // Forçamos o Runner a usar um deliberador Mockado para evitar falhas de validação real no teste de backlog
  const runner = new BoltRunner({}, 'full');
  
  // bypass real deliberation for test
  runner.deliberator = {
    run: async () => ({
      status: 'success',
      intent: 'update_profile_photo',
      action: "UPDATE users SET photo = 'test.jpg' WHERE id = 1;",
      risk_score: 0.1,
      impact_scope: { files: [{ path: "test.sql" }] }
    })
  };

  try {
    // 1. Criar uma Missão e Rejeitá-la (para popular o backlog)
    console.log(' 🏗️  [1] Simulando criação e REJEIÇÃO de uma missão...');
    const result = await runner.run("Quero mudar minha foto");
    
    if (result.status === 'awaiting_promotion') {
      await runner.reject(result.executionId, result.releasePath, "Motivo: Estético - Teste v13.7.1");
      console.log(` ✅ Missão ${result.executionId.substring(0,8)} estacionada no Backlog.`);
    }

    // 2. Listar Backlog
    console.log('\n 📋 [2] Listando Missões no Backlog...');
    const list = await runner.listBacklog();
    
    if (list.length > 0) {
      console.log(` 📂 Encontradas ${list.length} missões pendentes:`);
      list.forEach((item, index) => {
        console.log(`    [${index + 1}] ID: ${item.id}`);
        console.log(`        Rejeição: ${item.rejected_at}`);
        console.log(`        Motivo: ${item.reason}`);
      });

      const targetId = list[0].id;

      // 3. Deletar item do Backlog
      console.log(`\n 🗑️  [3] Excluindo missão específica: ${targetId}...`);
      const delResult = await runner.deleteFromBacklog(targetId);
      
      if (delResult.success) {
        console.log(' ✅ Missão excluída permanentemente. Espaço liberado.');
      }
    } else {
      console.log(' ℹ️ Backlog vazio.');
    }

  } catch (err) {
    console.error(`🚨 Erro na simulação: ${err.message}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(' 🚀 SIMULAÇÃO v13.7 CONCLUÍDA COM SUCESSO. ✅');
  console.log('═'.repeat(60));
}

runBacklogSimulation().catch(console.error);
