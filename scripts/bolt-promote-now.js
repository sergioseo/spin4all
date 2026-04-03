/**
 * BOLT: PROMOTE NOW
 * Script para promoção direta do que está na pasta /draft para /current.
 * Ideal para testes de ponta a ponta reais onde a IA gera o código e o 
 * humano dispara o gatilho de produção.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const PromoteService = require('../backend/src/governance/services/promote-service');

async function main() {
  console.log('🚀 [BOLT:MANUAL_PROMOTE] Iniciando promoção direta do rascunho...');
  
  const executionId = 'manual-e2e-real';
  const promoter = new PromoteService(executionId);
  
  try {
    // Simulamos um manifesto mínimo para o promoter
    const mockManifest = {
      execution_id: executionId,
      timestamp: new Date().toISOString()
    };
    
    await promoter.promote(mockManifest);
    console.log(`\n✅ [BOLT:SUCCESS] Promoção concluída com sucesso!`);
    console.log(`📂 Verifique em: scripts/bolt/current/`);
  } catch (err) {
    console.error(`\n❌ [BOLT:ERROR] Falha na promoção:`, err.message);
    process.exit(1);
  }
}

main();
