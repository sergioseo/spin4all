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
        if (!this.manifest) return { success: false, reason: 'Manifesto não carregado.' };

        // Arquivos que a própria governança altera e devem ser ignorados na validação de escopo
        const internalFiles = [
            'TASK_MANIFEST.json',
            'package-lock.json',
            'node_modules'
        ];

        const forbidden = changedFiles.filter(file => {
            // Se for arquivo interno da governança, ignora
            if (internalFiles.some(internal => file.includes(internal))) return false;
            if (file.includes('backend/src/governance/logs/')) return false;

            // Se o manifesto usa wildcard "*", permite tudo (FULL_ACCESS)
            if (this.manifest.allowed_files.includes('*')) return false;

            // Valida contra lista de permitidos
            return !this.manifest.allowed_files.some(allowed => {
                if (allowed.endsWith('/*')) {
                    const dir = allowed.replace('/*', '');
                    return file.startsWith(dir);
                }
                return file === allowed;
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
