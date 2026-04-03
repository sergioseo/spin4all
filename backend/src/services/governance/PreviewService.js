/**
 * SPIN4ALL: Preview Service (SAFENED)
 * Responsável por servir arquivos da Sandbox (Draft) para visualização pré-aprovação. 🛰️🖼️
 */

const fs = require('fs');
const path = require('path');

// Caminho base para os drafts (Sandbox) do BOLT Engine
// Calculamos de forma absoluta a partir de __dirname para garantir consistência (5 níveis acima para chegar no root Antigravity)
const BASE_DRAFT_PATH = path.resolve(__dirname, '../../../../../bolt-engine-core/scripts/bolt/draft');

const PreviewService = {
    /**
     * Tenta ler um arquivo da sandbox de uma missão específica.
     */
    async getFile(missionId, filePath = 'index.html') {
        const missionDir = path.join(BASE_DRAFT_PATH, missionId);
        
        // Proteção contra Directory Traversal
        const safePath = path.normalize(path.join(missionDir, filePath));
        if (!safePath.startsWith(path.normalize(missionDir))) {
            throw new Error('UNAUTHORIZED_ACCESS');
        }

        if (!fs.existsSync(safePath)) {
            // Resiliência: Se não encontrar o arquivo específico, tenta abrir QUALQUER arquivo HTML no diretório
            const files = fs.readdirSync(missionDir);
            const htmlFile = files.find(f => f.endsWith('.html'));
            
            if (htmlFile) return { content: fs.readFileSync(path.join(missionDir, htmlFile)), mime: 'text/html' };
            
            // Se ainda não encontrar, mas a pasta existe, informa que a sandbox está ativa mas sem vista HTML
            throw new Error('FILE_NOT_FOUND');
        }

        const extension = path.extname(safePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };

        return {
            content: fs.readFileSync(safePath),
            mime: mimeTypes[extension] || 'text/plain'
        };
    }
};

module.exports = PreviewService;
