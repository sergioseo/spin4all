const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const logger = require('./utils/logger');

/**
 * SPIN4ALL - Promote Engine 10.1
 * Responsável pela promoção segura de código do /draft para o /prod
 */

class PromoteEngine {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        this.draftDir = path.join(baseDir, 'draft');
        this.prodDir = path.join(baseDir, 'prod');
        this.backupDir = path.join(baseDir, 'backup');
    }

    /**
     * Calcula o hash recursivo de uma pasta para garantir integridade
     */
    hashFolder(folder) {
        if (!fs.existsSync(folder)) return null;
        
        const files = this.getAllFiles(folder);
        const hash = crypto.createHash('sha256');

        files.sort().forEach(file => {
            const relativePath = path.relative(folder, file);
            hash.update(relativePath); // Hash do nome/caminho
            const content = fs.readFileSync(file);
            hash.update(content); // Hash do conteúdo
        });

        return hash.digest('hex');
    }

    /**
     * Auxiliar para listar todos os arquivos recursivamente
     */
    getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        });

        return arrayOfFiles;
    }

    /**
     * Executa o backup da produção atual
     */
    createBackup() {
        console.log('[PROMOTE] Criando backup de segurança...');
        if (fs.existsSync(this.backupDir)) {
            fs.rmSync(this.backupDir, { recursive: true, force: true });
        }
        if (fs.existsSync(this.prodDir)) {
            // No Windows, cp -r pode falhar se o destino não existir ou via shell.
            // Usaremos rsync-like copy ou comando nativo seguro.
            execSync(`xcopy "${this.prodDir}" "${this.backupDir}" /E /I /H /Y /Q`);
        }
    }

    /**
     * Recupera o backup em caso de falha
     */
    rollback() {
        console.error('[PROMOTE] 🚨 Iniciando ROLLBACK automático...');
        if (fs.existsSync(this.prodDir)) {
            fs.rmSync(this.prodDir, { recursive: true, force: true });
        }
        if (fs.existsSync(this.backupDir)) {
            execSync(`xcopy "${this.backupDir}" "${this.prodDir}" /E /I /H /Y /Q`);
            console.log('[PROMOTE] ✅ Rollback concluído com sucesso.');
        } else {
            console.error('[PROMOTE] ❌ Erro Fatal: Backup não encontrado para rollback!');
        }
    }

    /**
     * Fluxo Principal de Promoção
     */
    async run() {
        try {
            const draftHash = this.hashFolder(this.draftDir);
            if (!draftHash) throw new Error('Pasta /draft não encontrada ou vazia.');

            // 1. Snapshot
            this.createBackup();

            // 2. Promoção Seletiva (Overlay)
            // Em vez de apagar tudo, apenas sobrescrevemos o que veio do /draft.
            // Isso preserva arquivos extras na produção (ex: monitoring.html).
            console.log('[PROMOTE] Iniciando Promoção Seletiva (Overlay) para /prod...');
            
            // Garantir que a pasta de produção existe
            if (!fs.existsSync(this.prodDir)) {
                fs.mkdirSync(this.prodDir, { recursive: true });
            }

            // xcopy /E /I /H /Y /C /Q
            // /Y: Ignora confirmação de sobrescrita
            // /E: Copia pastas e subpastas
            // /I: Se o destino não existir, assume que é pasta
            // /H: Copia ocultos
            // /C: Continua mesmo em erro
            execSync(`xcopy "${this.draftDir}" "${this.prodDir}" /E /I /H /Y /C /Q`);

            // 3. Validação de Integridade Pós-Cópia
            const prodHash = this.hashFolder(this.prodDir);
            
            if (draftHash !== prodHash) {
                console.error('[PROMOTE] ❌ Inconsistência Detectada: Hashes divergentes.');
                this.rollback();
                return { success: false, reason: 'Hash Mismatch' };
            }

            console.log('[PROMOTE] ✨ Promoção concluída com 100% de integridade.');
            return { success: true, hash: prodHash };

        } catch (err) {
            console.error('[PROMOTE] Erro durante a promoção:', err.message);
            this.rollback();
            return { success: false, reason: err.message };
        }
    }
}

module.exports = PromoteEngine;
