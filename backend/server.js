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

// --- INICIALIZAÇÃO "SMART" ---
app.listen(PORT, '127.0.0.1', async () => {
    console.log(`--- SPIN4ALL SERVER VERSION 11.0 (CLEAN) ---`);
    console.log(`✅ [SERVER:CLEAN] DISPONÍVEL em http://127.0.0.1:${PORT}`);
    
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

        console.log('✨ [INIT] Sistema legado e modular integrado.');
    } catch (err) {
        console.error('❌ [INIT:ERR] Erro no carregamento secundário:', err.message);
    }
};

// Graceful Shutdown
process.on('SIGINT', () => { console.log('👋 Encerrando...'); process.exit(0); });
