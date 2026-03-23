console.log('--- SPIN4ALL SERVER VERSION 8000 (MODULAR) ---');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { runMigrations } = require('./src/config/setup');

// Importar Rotas
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const analysisRoutes = require('./src/routes/analysis.routes');
const communityRoutes = require('./src/routes/community.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Registro de Rotas da API
app.use('/api/admin', adminRoutes); // /api/admin/reports, etc. (More specific first)
app.use('/api', authRoutes); // /api/login, /api/register
app.use('/api', userRoutes); // /api/me, /api/update-profile
app.use('/api', attendanceRoutes); // /api/checkin, /api/my-attendance
app.use('/api', analysisRoutes); // /api/tournament-summary
app.use('/api', communityRoutes); // /api/stats, /api/hall-fama

// Rotas de Navegação (HTML)
app.get('/', (req, res) => res.redirect('/login.html'));
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

    // 3. Subir Servidor
    app.listen(PORT, () => {
        console.log(`[SERVER] Rodando na porta ${PORT}`);
        console.log(`[SERVER] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();
