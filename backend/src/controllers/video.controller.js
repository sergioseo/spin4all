const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

/**
 * Controller: Video Management (BOLT Industrial)
 */
const videoController = {
    /**
     * Get the latest 10 videos
     */
    getVideos: async (req, res) => {
        try {
            const query = `
                SELECT id_video, dsc_titulo, dsc_video_url, dsc_thumb_url, dt_registro 
                FROM trusted.tb_videos 
                ORDER BY dt_registro DESC 
                LIMIT 10
            `;
            const { rows } = await pool.query(query);
            res.json({ success: true, videos: rows });
        } catch (err) {
            console.error('[VIDEO:GET] Error:', err);
            res.status(500).json({ success: false, message: 'Erro ao buscar vídeos.' });
        }
    },

    /**
     * Add a new video with automatic thumbnail
     */
    addVideo: async (req, res) => {
        try {
            console.log('[VIDEO:ADD] Recebido:', req.body.title);
            console.log('[VIDEO:ADD] Arquivos:', req.files);
            
            const { title } = req.body;
            const videoFile = req.files && req.files['video'] ? req.files['video'][0] : null;
            const thumbFile = req.files && req.files['thumb'] ? req.files['thumb'][0] : null;

            if (!videoFile || !title) {
                return res.status(400).json({ success: false, message: 'Título e vídeo são obrigatórios.' });
            }

            // Caminhos relativos para o banco
            const videoUrl = `/assets/videos/${videoFile.filename}`;
            const thumbUrl = thumbFile ? `/assets/videos/${thumbFile.filename}` : null;

            const query = `
                INSERT INTO trusted.tb_videos (dsc_titulo, dsc_video_url, dsc_thumb_url)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const { rows } = await pool.query(query, [title, videoUrl, thumbUrl]);

            res.json({ success: true, message: 'Vídeo adicionado com sucesso!', video: rows[0] });
        } catch (err) {
            console.error('[VIDEO:ADD] Error:', err);
            res.status(500).json({ success: false, message: 'Erro ao salvar vídeo.' });
        }
    }
};

module.exports = videoController;
