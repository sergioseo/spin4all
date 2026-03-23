const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('./utils/logger');

/**
 * SPIN4ALL - Agent Controller 10.1
 * Responsável por validar o escopo da tarefa contra o TASK_MANIFEST.json
 */

class AgentController {
    constructor(manifestPath = './TASK_MANIFEST.json') {
        this.manifestPath = manifestPath;
        this.manifest = this.loadManifest();
    }

    loadManifest() {
        try {
            if (!fs.existsSync(this.manifestPath)) {
                throw new Error(`Manifesto não encontrado em: ${this.manifestPath}`);
            }
            return JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
        } catch (err) {
            logger.error('Erro ao carregar manifesto', { path: this.manifestPath, error: err.message });
            return null;
        }
    }

    /**
     * Detecta arquivos alterados via Git (No ambiente de Draft)
     */
    getChangedFiles() {
        try {
            // Name-only diff de arquivos não commitados
            const stdout = execSync('git diff --name-only').toString();
            return stdout.split('\n').filter(f => f.trim().length > 0);
        } catch (err) {
            logger.error('Erro ao detectar mudanças git', { error: err.message });
            return [];
        }
    }

    /**
     * Valida se os arquivos alterados estão dentro da lista permitida (allowed_files)
     */
    validateScope(changedFiles) {
        if (!this.manifest) return { success: false, reason: 'Manifesto inválido' };

        const forbidden = changedFiles.filter(file => {
            return !this.manifest.allowed_files.some(allowed => {
                // Suporte simplificado para wildcard *
                const pattern = allowed.replace('*', '.*');
                const regex = new RegExp(`^${pattern}`);
                return regex.test(file);
            });
        });

        if (forbidden.length > 0) {
            return {
                success: false,
                reason: `Tentativa de editar arquivos fora do escopo: ${forbidden.join(', ')}`
            };
        }

        return { success: true };
    }

    /**
     * Registra o início da execução (Gera ID de Correlação se necessário)
     */
    startExecution() {
        const executionId = this.manifest ? this.manifest.task_id : `task_${Date.now()}`;
        console.log(`[GOVERNANCE] Iniciando Task: ${executionId}`);
        process.env.CURRENT_EXECUTION_ID = executionId;
        return executionId;
    }
}

module.exports = AgentController;
