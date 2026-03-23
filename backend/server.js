console.log('--- SPIN4ALL SERVER VERSION 9.6 (ORCHESTRATION ELITE) ---');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { runMigrations } = require('./src/config/setup');

// --- OBSERVABILIDADE INDUSTRIAL ---
process.on('SIGTERM', () => {
    console.log('⚠️ [SIGNAL] SIGTERM recebido. Encerrando graciosamente...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('⚠️ [SIGNAL] SIGINT recebido. Encerrando...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ [FATAL] Exceção não tratada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ [FATAL] Rejeição não tratada em:', promise, 'razão:', reason);
});

// Heartbeat para manter o loop ativo e debug
setInterval(() => {
    console.log(`[HEARTBEAT] ${new Date().toISOString()} - PID: ${process.pid} - Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
}, 60000);
// ---------------------------------

// Importar Rotas
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const analysisRoutes = require('./src/routes/analysis.routes');
const communityRoutes = require('./src/routes/community.routes');
const adminRoutes = require('./src/routes/admin.routes');
const { startWorkers } = require('./src/infrastructure/queue/QueueWorker');

const app = express();

// --- HEALTH CHECK IMEDIATO (Para o Easypanel não matar o processo) ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP', version: '9.6' }));
app.get('/', (req, res) => res.redirect('/index.html')); 

// Middlewares Globais
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Registro de Rotas da API
app.use('/api/admin', adminRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', analysisRoutes);
app.use('/api', communityRoutes);

// Rotas de Navegação (HTML)
app.get('/', (req, res) => res.status(200).send('API Online v9.0')); 
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dashboard.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/checkin.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/checkin.html')));
app.get('/cadastro.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/cadastro.html')));
app.get('/monitoring.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/monitoring.html')));

// Estáticos
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API Online v8.0', message: 'Spin4All Modular Architecture active.' });
});

// Inicialização
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // 1. Garantir pastas de upload
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // 2. Rodar Migrações
    await runMigrations();

    // 3. Iniciar Orquestrador de Filas (BullMQ)
    console.log('[DEBUG] Chamando startWorkers()...');
    startWorkers();
    console.log('[DEBUG] startWorkers() chamado com sucesso.');

    // 4. Subir Servidor
    app.listen(PORT, () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();
