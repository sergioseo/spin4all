const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/db');
const fs = require('fs');

/**
 * BOLT: Video Sincronization Script
 * Sincroniza arquivos físicos com a base de dados tb_videos.
 */
async function seedVideos() {
    console.log('⏳ [SYNC] Iniciando sincronização de vídeos...');
    const videoDir = path.resolve(__dirname, '../assets/videos');
    
    try {
        const files = fs.readdirSync(videoDir);
        const videos = files.filter(f => f.endsWith('.mp4'));

        for (const video of videos) {
            const title = video.replace('.mp4', '').toUpperCase(); // Ex: VIDEO1
            const videoUrl = `/assets/videos/${video}`;
            
            // Tentar achar thumb correspondente (ex: video1_thumb.jpg ou video1.jpg)
            let thumbUrl = null;
            const thumbCandidates = [`${video.replace('.mp4', '')}_thumb.jpg`, `${video.replace('.mp4', '')}.jpg` ];
            for (const cand of thumbCandidates) {
                if (fs.existsSync(path.join(videoDir, cand))) {
                    thumbUrl = `/assets/videos/${cand}`;
                    break;
                }
            }

            // Inserir se não existir
            const checkQuery = 'SELECT id_video FROM trusted.tb_videos WHERE dsc_video_url = $1';
            const { rows } = await pool.query(checkQuery, [videoUrl]);

            if (rows.length === 0) {
                console.log(`➕ [SYNC] Adicionando: ${title}`);
                await pool.query(
                    'INSERT INTO trusted.tb_videos (dsc_titulo, dsc_video_url, dsc_thumb_url) VALUES ($1, $2, $3)',
                    [title, videoUrl, thumbUrl]
                );
            }
        }

        console.log('✅ [SYNC] Sincronização concluída com sucesso.');
    } catch (err) {
        console.error('❌ [SYNC:ERR]', err.message);
    } finally {
        process.exit(0);
    }
}

seedVideos();
