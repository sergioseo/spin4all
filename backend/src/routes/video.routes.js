const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer para Vídeos e Thumbs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.resolve(__dirname, '../../../assets/videos');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Aumentado para 100MB
});

// Rota Pública: Listar Vídeos (Últimos 10)
router.get('/', videoController.getVideos);

// Rota Admin: Adicionar Vídeo (Com Auto-Thumb do Frontend)
router.post('/add', authenticateToken, isAdmin, (req, res, next) => {
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumb', maxCount: 1 }
    ])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[MULTER] Erro:', err.code);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'Vídeo muito grande. Limite de 50MB.' });
            }
            return res.status(400).json({ success: false, message: 'Erro no upload: ' + err.code });
        } else if (err) {
            console.error('[UPLOAD] Erro desconhecido:', err);
            return res.status(500).json({ success: false, message: 'Erro interno no processamento do arquivo.' });
        }
        next();
    });
}, videoController.addVideo);

module.exports = router;
