/**
 * SPIN4ALL: Optimized Server (CLEAN v11.0) 🛡️⚡🏆
 * Versão Limpa: Centraliza .env e usa Lazy Loading para garantir startup instantâneo.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 1. Único e centralizado carregamento de variáveis
console.log('⏳ [ENV] Inicializando ambiente...');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3456;

// Caminho absoluto para o frontend
const FRONTEND_PATH = path.resolve(__dirname, '../frontend');

// Middlewares Imediatos
app.use(cors());
app.use(express.json());

// Log de Diagnóstico (Para rastreio em tempo real)
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// Entrega imediata de arquivos estáticos (Antes de carregar qualquer módulo pesado)
app.use(express.static(FRONTEND_PATH));
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/tools', express.static(path.resolve(__dirname, '../tools')));

// Atalhos Rápidos (Diferenciados para evitar conflito)
app.get('/api/health', (req, res) => res.status(200).json({ status: 'CLEAN_UP', time: new Date() }));
app.get('/', (req, res) => res.sendFile(path.join(FRONTEND_PATH, 'index.html')));

// --- REGISTRO DE ROTAS (Carregadas sob demanda ou em ordem) ---
// Importamos aqui para não travar o topo do arquivo
app.use('/api', require('./src/routes/auth.routes'));
app.use('/api', require('./src/routes/user.routes'));
app.use('/api', require('./src/routes/attendance.routes'));
app.use('/api', require('./src/routes/analysis.routes'));
app.use('/api', require('./src/routes/community.routes'));
app.use('/api', require('./src/routes/governance.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/videos', require('./src/routes/video.routes'));

// --- INICIALIZAÇÃO "SMART" ---
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`--- SPIN4ALL SERVER VERSION 11.0 (CLEAN) ---`);
    console.log(`✅ [SERVER:CLEAN] DISPONÍVEL em http://0.0.0.0:${PORT}`);
    
    // Serviços que podem demorar ficam aqui em uma função separada (não bloqueantes)
    initHeavyServices();
});

const initHeavyServices = async () => {
    try {
        console.log('⏳ [INIT] Carregando serviços de infraestrutura (Background)...');
        
        // 1. Garantir pastas de upload
        const uploadDir = path.resolve(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        // 2. Banco de Dados e Migrações (Apenas agora que o portal já abriu)
        const { runMigrations } = require('./src/config/setup');
        await runMigrations();

        // 3. Workers de Fila (BullMQ/Redis)
        const { startWorkers } = require('./src/infrastructure/queue/QueueWorker');
        startWorkers();

        // 4. Sincronização de Vídeos (BOLT Protocol)
        await syncPhysicalVideos();

        console.log('✨ [INIT] Sistema legado e modular integrado.');
    } catch (err) {
        console.error('❌ [INIT:ERR] Erro no carregamento secundário:', err.message);
    }
};

/**
 * Sincroniza arquivos mp4 da pasta assets/videos com o banco de dados
 */
const syncPhysicalVideos = async () => {
    try {
        const pool = require('./src/config/db');
        const videoDir = path.resolve(__dirname, '../assets/videos');
        if (!fs.existsSync(videoDir)) return;

        const files = fs.readdirSync(videoDir);
        const videos = files.filter(f => f.endsWith('.mp4'));

        for (const video of videos) {
            const videoUrl = `/assets/videos/${video}`;
            const { rows } = await pool.query('SELECT id_video FROM trusted.tb_videos WHERE dsc_video_url = $1', [videoUrl]);

            if (rows.length === 0) {
                const title = video.replace('.mp4', '').toUpperCase();
                let thumbUrl = null;
                if (fs.existsSync(path.join(videoDir, video.replace('.mp4', '_thumb.jpg')))) {
                    thumbUrl = `/assets/videos/${video.replace('.mp4', '_thumb.jpg')}`;
                } else if (fs.existsSync(path.join(videoDir, video.replace('.mp4', '.jpg')))) {
                    thumbUrl = `/assets/videos/${video.replace('.mp4', '.jpg')}`;
                }
                
                await pool.query(
                    'INSERT INTO trusted.tb_videos (dsc_titulo, dsc_video_url, dsc_thumb_url) VALUES ($1, $2, $3)',
                    [title, videoUrl, thumbUrl]
                );
                console.log(`[SYNC] Vídeo novo detectado e registrado: ${title}`);
            }
        }
    } catch (err) {
        console.error('[SYNC:ERR] Falha ao sincronizar vídeos:', err.message);
    }
};

// Graceful Shutdown
process.on('SIGINT', () => { console.log('👋 Encerrando...'); process.exit(0); });
