const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/db');

/**
 * BOLT: Legacy Names Fix
 * Restaura títulos amigáveis para os vídeos originais do projeto.
 */
async function fixLegacyNames() {
    console.log('⏳ [FIX] Renomeando vídeos legados...');
    const updates = [
        { url: '/assets/videos/video1.mp4', title: 'Treino Dinâmico - Grupos' },
        { url: '/assets/videos/video2.mp4', title: 'Dancinha de Alta Performance' },
        { url: '/assets/videos/video3.mp4', title: 'Nossa Comunidade em Ação' },
        { url: '/assets/videos/video4.mp4', title: 'Andrezão em Ação' }
    ];

    try {
        for (const update of updates) {
            await pool.query('UPDATE trusted.tb_videos SET dsc_titulo = $1 WHERE dsc_video_url = $2', [update.title, update.url]);
            console.log(`✅ [FIX] Atualizado: ${update.title}`);
        }
        console.log('✨ [FIX] Processo concluído.');
    } catch (err) {
        console.error('❌ [FIX:ERR]', err.message);
    } finally {
        process.exit(0);
    }
}

fixLegacyNames();
