const { execSync } = require('child_process');
const logger = require('./utils/logger');

/**
 * SPIN4ALL - Diff Engine 10.1
 * Responsável pela análise semântica das mudanças e classificação de risco.
 */

class DiffEngine {
    constructor() {}

    /**
     * Obtém o diff detalhado de um arquivo específico
     */
    getDiff(file) {
        try {
            return execSync(`git diff ${file}`).toString();
        } catch (err) {
            console.error(`[DIFF] Erro ao obter diff de ${file}:`, err.message);
            return '';
        }
    }

    /**
     * Analisa o conteúdo do diff para classificar a natureza da mudança
     */
    classifyChange(diff) {
        const classifications = [];

        // Detecção de chamadas de API / Protocolos
        if (diff.includes('fetch(') || diff.includes('axios') || diff.includes('apiFetch')) {
            classifications.push({ type: 'api_change', risk: 'HIGH' });
        }

        // Detecção de Lógica de Negócio / Funções
        if (diff.includes('function') || diff.includes('=>') || diff.includes('async')) {
            classifications.push({ type: 'logic_change', risk: 'MEDIUM' });
        }

        // Detecção de Estilos / Layout
        if (diff.includes('className') || diff.includes('style=') || diff.includes('.css')) {
            classifications.push({ type: 'style_change', risk: 'LOW' });
        }

        // Se houver múltiplas, retorna a de maior risco
        if (classifications.length === 0) return { type: 'unknown', risk: 'MEDIUM' };

        // Ordenar por risco (HIGH > MEDIUM > LOW)
        const riskMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return classifications.sort((a, b) => riskMap[b.risk] - riskMap[a.risk])[0];
    }

    /**
     * Analisa uma lista de arquivos e retorna o diagnóstico completo
     */
    analyzeFiles(files) {
        return files.map(file => {
            const diff = this.getDiff(file);
            const classification = this.classifyChange(diff);
            return {
                file,
                ...classification
            };
        });
    }

    /**
     * Aplica as regras do manifesto sobre a análise realizada
     */
    enforceRules(analysis, manifest) {
        for (const change of analysis) {
            // Regra 1: Bloqueio por Risco vs Escopo
            if (change.risk === 'HIGH' && manifest.scope === 'UI_ONLY') {
                return {
                    status: 'BLOCKED',
                    reason: `Mudança de alto risco (API) detectada em ${change.file} (Escopo: UI_ONLY)`
                };
            }

            // Regra 2: Bloqueio por Operações Proibidas no Manifesto
            if (manifest.forbidden_operations) {
                if (manifest.forbidden_operations.includes('edit_api_call') && change.type === 'api_change') {
                    return {
                        status: 'BLOCKED',
                        reason: `Operação proibida (edit_api_call) detectada em ${change.file}`
                    };
                }
                if (manifest.forbidden_operations.includes('edit_business_logic') && change.type === 'logic_change') {
                    // Nota: Aqui poderíamos ter mais granularidade, mas por enquanto bloqueia qualquer mudança lógica
                    return {
                        status: 'BLOCKED',
                        reason: `Operação proibida (edit_business_logic) detectada em ${change.file}`
                    };
                }
            }
        }

        return { status: 'OK' };
    }
}

module.exports = DiffEngine;
