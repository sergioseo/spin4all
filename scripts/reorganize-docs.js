const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');
const outrosDir = path.join(docsDir, 'outros');

if (!fs.existsSync(outrosDir)) {
    fs.mkdirSync(outrosDir);
}

const renameMap = {
    // BOLT - Protocolo de Governança
    'bolt_implementation_plan_fase6_orquestracao_execucao': 'BOLT_PLAN_Fase6_Orquestracao_Execucao.md',
    'bolt_implementation_plan_fase7_sandbox_promocao.md': 'BOLT_PLAN_Fase7_Sandbox_Promocao.md',
    'bolt_papeis_camada_deliberacao.md': 'BOLT_Papeis_Camada_Deliberacao.md',
    'bolt_roadmap_resolucao_restricoes.md': 'BOLT_Roadmap_Resolucao_Restricoes.md',
    'bolt_estrutura_protocolo': 'BOLT_Estrutura_do_Protocolo.md',
    'bolt_vs_tico_arquitetura.md': 'BOLT_vs_TICO_Arquitetura.md',
    'centro_comando_governanca': 'BOLT_Centro_de_Comando.md',
    'CHECKLIST_GOVERNANCA_10_1.md': 'BOLT_Checklist_Governanca_10_1.md',
    'BOLT_NOTION_SETUP_GUIDE.md': 'BOLT_Notion_Setup_Guide.md',

    // TICO - Sistema de Missões
    'TICO_Checklist_Execucao.md': 'TICO_Checklist_Execucao.md',
    'TICO_INFRAESTRUTURA_ESTRUTURADA.md': 'TICO_Infraestrutura_Estruturada.md',

    // TECH - Padrões & Infra
    'TECHNICAL_STANDARDS.md': 'TECH_Padroes_Tecnicos.md',
    'CI_CD_METODOLOGIA.md': 'TECH_Metodologia_CICD.md',
    'ARQUITETURA_AI_ELITE.md': 'TECH_Arquitetura_AI_Elite.md',
    'PLANO_ORQUESTRACAO_BULLMQ_ELITE.md': 'TECH_Plano_Orquestracao_BullMQ.md',
    'PLANO_MONITORAMENTO_ORQUESTRACAO.md': 'TECH_Plano_Monitoramento.md',
    'TICO_Arquitetura_Skills_v3.md': 'TECH_TICO_Arquitetura_Skills_v3_Ref.md',

    // PLAN - Planos de Produto
    'DOCUMENTO_FUNCIONALIDADES_SPIN4ALL.md': 'PLAN_Funcionalidades_Base.md',
    'PLANO_GOVERNANCA_AI_10_1_CONSOLIDADO.md': 'PLAN_Governanca_AI_Consolidado.md',
    'implementation_plan_consolidated_hub.md': 'PLAN_Consolidated_Hub.md',
    'implementation_plan_mission_expansion.md': 'PLAN_Mission_Expansion.md',
    'implementation_plan_tournament_analyst.md': 'PLAN_Tournament_Analyst.md',
    'plano_otimizacao_arquitetura_site_v1.ini': 'PLAN_Otimizacao_Site_v1.ini',

    // AUDIT - Auditoria & Testes
    'BOLT_AUDITORIA_MASSIVA_100.md': 'AUDIT_BOLT_Auditoria_Massiva.md',
    'BOLT_E2E_AUDITORIA_100.md': 'AUDIT_BOLT_E2E_Audit_100.md',
    'BOLT_E2E_AUDITORIA_HUMANA_100.md': 'AUDIT_BOLT_E2E_Humana.md',
    'DIAGNOSTICO_ESTRATEGIA_LOGS.md': 'AUDIT_Diagnostico_Estrategia_Logs.md',
    'ANALISE_GAP_ARQUITETURA.md': 'AUDIT_Analise_Gap_Arquitetura.md',
    'analyst_agent_technical_audit.md': 'AUDIT_TICO_Analyst_Agent.md',
    'analyst_engine_audit.MD': 'AUDIT_TICO_Analyst_Engine.md',
    'tournament_analyst_scenarios.md': 'AUDIT_Tournament_Analyst_Scenarios.md',

    // UI - Design & Style
    'STYLE_GUIDE.md': 'UI_Style_Guide_Elite.md',

    // Analyst Docs (Agrupar como TICO ou AUDIT conforme contexto)
    'analyst_engine_flow.md': 'TICO_Analyst_Engine_Flow.md',
    'analyst_mission_generation_logic.md': 'TICO_Analyst_Mission_Logic.md',
    'analyst_mission_parameters.md': 'TICO_Analyst_Mission_Params.md',
    'analyst_prompt_risk_analysis.md': 'TICO_Analyst_Risk_Analysis.md',
    'analyst_prompt_v3_evaluation.md': 'TICO_Analyst_v3_Evaluation.md',
    'analyst_real_data_dump.md': 'TICO_Analyst_Data_Dump.md'
};

const moveToList = {
    // Arquivos que sofreram merge e agora são legados
    'bolt_implementacao_log_debug_v1.md': 'OTHER_BOLT_Log_v1_Legado.md',
    'bolt_implementacao_log_debug_v1': 'OTHER_BOLT_Log_v1_SemExtensao.md',
    'bolt_walkthrough_fase5': 'OTHER_BOLT_Walkthrough_F5_v2.16.md',
    'bolt_walkthrough_fase5_constraint_resolution_layer': 'OTHER_BOLT_Walkthrough_F5_v2.7.md',
    'TICO_Plano_Implementacao.md': 'OTHER_TICO_Plano_Original.md',
    'TICO_Update_Plan.md': 'OTHER_TICO_Update_Plan_Prompts.md',
    'TICO_Checklist_Execucao.md': 'OTHER_TICO_Checklist_Exec.md',
    'PLANO_DE_IMPLEMENTACAO_PADRAO.md': 'OTHER_Template_Plano_Padrao.md'
};

console.log('--- Iniciando Reorganização de Docs ---');

// 1. Executar Renomeações (Raiz)
for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(docsDir, oldName);
    const newPath = path.join(docsDir, newName);

    if (fs.existsSync(oldPath)) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Renomeado: ${oldName} -> ${newName}`);
        } catch (e) {
            console.error(`❌ Erro renomeando ${oldName}: ${e.message}`);
        }
    }
}

// 2. Mover para /outros (Legados)
for (const [oldName, newName] of Object.entries(moveToList)) {
    const oldPath = path.join(docsDir, oldName);
    const newPath = path.join(outrosDir, newName);

    if (fs.existsSync(oldPath)) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`📦 Movido para /outros: ${oldName} -> ${newName}`);
        } catch (e) {
            console.error(`❌ Erro movendo ${oldName}: ${e.message}`);
        }
    }
}

console.log('--- Reorganização Concluída ---');
