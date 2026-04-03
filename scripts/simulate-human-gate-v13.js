/**
 * BOLT: Human-in-the-Loop Simulation (v13.0)
 * 
 * Simula o fluxo de "Preparo -> Pausa -> Aprovação -> Promoção".
 * 🧪🔬🏁
 */

const BoltRunner = require('../backend/src/governance/bolt-runner');
const fs = require('fs');
const path = require('path');

async function runHumanGateSimulation() {
  console.log('========================================');
  console.log('🛫 [BOLT:SIMULATION] Starting Stage 13 HUMAN-GATE MISSION...');
  console.log('💬 Input: "Quero que mude minha foto para uma do Brad Pitt"');
  console.log('========================================\n');

  // Mock de Habilidades (Audit v2.16 COMPLIANT)
  const mockSkills = {
    scanner: { 
      run: async () => ({ 
        decision: { summary: "Scan complete", reason: "Analyzing user intent for photo update" }, 
        target_skill: "architect", 
        context_summary: "Photo update request", 
        entities: ["users"], 
        risks: [], 
        confidence: { overall: 1.0 }, 
        contract_readiness: { ready: true } 
      }) 
    },
    po: { 
      run: async () => ({ 
        decision: { summary: "Mission approved", reason: "Field update within safe limits" }, 
        target_skill: "architect", 
        refined_task: "Change profile_photo for user", 
        approved: true, 
        confidence: { overall: 1.0 }, 
        scope: "FIELD_LEVEL" 
      }) 
    },
    architect: { 
      run: async () => ({ 
        decision: { summary: "Generating SQL migration", reason: "Standard entity update protocol" },
        target_skill: "executor",
        technical_spec: "SQL UPDATE with Intent Rewriting",
        intent: "update_profile_photo", 
        action: "UPDATE users SET profile_photo = 'brad_pitt.jpg' WHERE id = 123;",
        status: "executing",
        impact_scope: { 
          files: [{ path: "semantic-migration.sql", change_type: "CREATE", estimated_diff_size: "5 lines" }], 
          services: ["database"], 
          data_changes: ["photo"] 
        },
        execution_plan: { 
          steps: [{ 
            order: 1, 
            name: "Database Update", 
            action: "UPDATE users SET profile_photo = 'brad_pitt.jpg' WHERE id = 123;", 
            scope: "file:semantic-migration.sql" 
          }] 
        }
      }),
      resolve: async () => ({})
    }
  };

  const runner = new BoltRunner(mockSkills);
  const currentPath = path.join(process.cwd(), 'scripts', 'bolt', 'current');
  
  // Pegar realpath antes de começar (para comparar se mudou)
  let initialRealPath = null;
  if (fs.existsSync(currentPath)) {
    initialRealPath = fs.realpathSync(currentPath);
  }

  // --- PARTE 1: PREPARO E PAUSA ---
  console.log('🏗️ [PART 1] Running Mission Pipeline (Preparation Mode)...');
  const result = await runner.run("Quero que mude minha foto para uma do Brad Pitt");

  console.log(`\n🚦 [GATE] Status: ${result.status.toUpperCase()}`);
  
  if (result.status === 'awaiting_promotion') {
    console.log('✅ SUCCESS: Bolt PAUSED and is awaiting approval.');
    console.log('📊 AUDIT REPORT:', JSON.stringify(result.audit_report, null, 2));

    // Verificar se /current mudou (NÃO deve ter mudado)
    if (fs.existsSync(currentPath)) {
      const currentRealPath = fs.realpathSync(currentPath);
      if (currentRealPath === initialRealPath) {
        console.log('🛡️ [PRODUCTION_GUARD] Verified: /current directory was NOT updated yet.');
      } else {
        console.error('❌ FAIL: /current was updated before approval!');
      }
    }

    // --- PARTE 2: APROVAÇÃO ---
    console.log('\n👤 [PART 2] Commander Decision: "APROVAR"');
    console.log('🚀 Triggering runner.approve()...');
    
    const finalResult = await runner.approve(result.executionId, result.releasePath);
    
    if (finalResult.status === 'success') {
      console.log('🏆 MISSION BROADCASTED AS LIVE! ✅');
      
      // Verificar se /current mudou (AGORA deve ter mudado)
      if (fs.existsSync(currentPath)) {
        const finalRealPath = fs.realpathSync(currentPath);
        if (finalRealPath !== initialRealPath) {
          console.log(`✅ [PROMOTION_VERIFIED] /current now points to: ${finalRealPath}`);
        } else {
          console.error('❌ FAIL: /current was NOT updated after approval!');
        }
      }
    }
  } else {
    console.error('❌ FAIL: Pipeline did not pause for approval.');
  }
}

runHumanGateSimulation().catch(console.error);
