const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de Logging Global
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname)); // Servir HTML, CSS e JS da raiz

// Rotas Explícitas para HTML (Garantia)
app.get('/', (req, res) => {
  console.log('[ACCESS] Rota / -> Redirecionando para /login.html');
  res.redirect('/login.html');
});
app.get('/login.html', (req, res) => {
  console.log(`[ACCESS] Solicitando login.html de: ${path.join(__dirname, 'login.html')}`);
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/dashboard.html', (req, res) => {
  console.log('[ACCESS] Solicitando dashboard.html');
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/admin.html', (req, res) => {
  console.log('[ACCESS] Solicitando admin.html');
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/checkin.html', (req, res) => {
  console.log('[ACCESS] Solicitando checkin.html');
  res.sendFile(path.join(__dirname, 'checkin.html'));
});
app.get('/cadastro.html', (req, res) => {
  console.log('[ACCESS] Solicitando cadastro.html');
  res.sendFile(path.join(__dirname, 'cadastro.html'));
});
app.get('/test-ping', (req, res) => res.send('pong'));

// Rota de Diagnóstico
app.get('/debug-static', (req, res) => {
  const loginPath = path.join(__dirname, 'login.html');
  const exists = fs.existsSync(loginPath);
  res.json({ __dirname, loginPath, exists, files: fs.readdirSync(__dirname) });
});

// Configuração do Multer para Upload de Fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // limite 2MB
});

// --- MIGRAÇÃO AUTOMÁTICA DE BANCO ---
const runMigrations = async () => {
  try {
    console.log('--- Verificando Migrações ---');
    // Tabela de histórico de metas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trusted.tb_usuarios_metas_historico (
          id_historico SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dt_referencia DATE DEFAULT CURRENT_DATE,
          num_score_mobilidade INTEGER,
          UNIQUE(id_usuario, dt_referencia)
      );
    `);
    // Colunas de habilidades técnicas
    await pool.query(`
      ALTER TABLE trusted.tb_membros_perfil 
      ADD COLUMN IF NOT EXISTS dsc_foto_perfil TEXT,
      ADD COLUMN IF NOT EXISTS dt_nascimento DATE,
      ADD COLUMN IF NOT EXISTS vlr_lateralidade TEXT DEFAULT 'Destro',
      ADD COLUMN IF NOT EXISTS dsc_empunhadura TEXT DEFAULT 'Clássica',
      ADD COLUMN IF NOT EXISTS dsc_objetivo TEXT,
      ADD COLUMN IF NOT EXISTS dsc_metas TEXT,
      ADD COLUMN IF NOT EXISTS num_altura_cm INTEGER,
      ADD COLUMN IF NOT EXISTS num_peso_kg INTEGER,
      ADD COLUMN IF NOT EXISTS num_telefone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS dsc_mensagem_mentor TEXT,
      ADD COLUMN IF NOT EXISTS num_skill_forehand INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_backhand INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_cozinhada INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_topspin INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_saque INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_rally INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_ataque INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_defesa INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_bloqueio INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_controle INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS num_skill_movimentacao INTEGER DEFAULT 50;
    `);

    // Garantir que a tabela de perfis tenha uma restrição UNIQUE no id_usuario para o ON CONFLICT funcionar
    await pool.query(`
      ALTER TABLE trusted.tb_membros_perfil 
      ADD CONSTRAINT unique_user_profile UNIQUE (id_usuario);
    `).catch(e => { /* Ignorar se já existir */ });

    // Master Admin Bootstrap: Se houver um ADMIN_EMAIL no .env, garante que ele seja admin e reseta a senha
    if (process.env.ADMIN_EMAIL) {
      console.log(`--- [BOOTSTRAP] Verificando privilégios para: ${process.env.ADMIN_EMAIL} ---`);
      
      const adminPassword = process.env.ADMIN_PASSWORD || 'rockstar2024';
      const adminHash = await bcrypt.hash(adminPassword, 10);
      
      // Garantir que o usuário admin existe (cria se não existir)
      await pool.query(`
        INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash, flg_admin)
        VALUES ($1, $2, TRUE)
        ON CONFLICT (dsc_email) DO UPDATE 
          SET flg_admin = TRUE, dsc_senha_hash = $2
      `, [process.env.ADMIN_EMAIL, adminHash]);
      
      const updateRes = await pool.query(
        'SELECT id_usuario FROM trusted.tb_usuarios WHERE LOWER(dsc_email) = LOWER($1)',
        [process.env.ADMIN_EMAIL]
      );
      if (updateRes.rowCount > 0) {
        console.log(`--- [BOOTSTRAP] SUCESSO: Admin configurado (${process.env.ADMIN_EMAIL} / ${adminPassword}) ---`);
      } else {
        console.log(`--- [BOOTSTRAP] AVISO: Nenhum usuário encontrado com o e-mail informado no .env ---`);
      }
    }

    // --- [SIMULAÇÃO] Popular Rankings do Mês Atual se estiverem vazios ---
    const checkEvolution = await pool.query("SELECT 1 FROM trusted.tb_membros_evolucao WHERE dt_registro >= DATE_TRUNC('month', CURRENT_DATE) LIMIT 1");
    if (checkEvolution.rowCount === 0) {
      console.log('--- [SEED] Gerando base de evolução para o mês atual ---');
      await pool.query(`
        INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total, dt_registro)
        SELECT u.id_usuario, (40 + floor(random() * 20))::float, DATE_TRUNC('month', CURRENT_DATE)
        FROM trusted.tb_usuarios u
        ON CONFLICT DO NOTHING;
      `);
    }

    const checkTournaments = await pool.query('SELECT 1 FROM trusted.tb_torneios_resultados LIMIT 1');
    if (checkTournaments.rowCount === 0) {
      console.log('--- [SEED] Gerando resultados de torneios ---');
      await pool.query(`
        INSERT INTO trusted.tb_torneios_resultados (id_usuario, num_posicao, dsc_torneio_nome, dt_torneio) VALUES
        (1, 1, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
        (99, 2, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
        (100, 3, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
        (101, 1, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days'),
        (102, 2, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days'),
        (103, 3, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days');
      `);
    }

    // --- [SEED] Check-ins dos últimos 7 dias (para Engajamento Semanal) ---
    const checkCheckins = await pool.query(
      "SELECT 1 FROM trusted.tb_checkins WHERE dt_checkin >= CURRENT_DATE - INTERVAL '7 days' LIMIT 1"
    );
    if (checkCheckins.rowCount === 0) {
      console.log('--- [SEED] Gerando check-ins para os últimos 7 dias ---');
      await pool.query(`
        INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin)
        SELECT 
          u.id_usuario,
          (CURRENT_DATE - (floor(random() * 7))::int * INTERVAL '1 day')::date
        FROM trusted.tb_usuarios u
        WHERE u.id_usuario != 1
        ON CONFLICT DO NOTHING;
      `);
    }

    // --- [SEED] Badges / Vitral de Conquistas ---
    const checkBadgeDefs = await pool.query('SELECT 1 FROM trusted.tb_badges_definicao LIMIT 1');
    if (checkBadgeDefs.rowCount === 0) {
      console.log('--- [SEED] Criando definições de badges ---');
      await pool.query(`
        INSERT INTO trusted.tb_badges_definicao (id_badge, dsc_nome, dsc_descricao, dsc_icone) VALUES
        (1, 'Primeiro Treino', 'Completou o primeiro check-in', 'fas fa-star'),
        (2, 'Semana Completa', '7 dias seguidos de presença', 'fas fa-fire'),
        (3, 'Veterano', '30 treinos no total', 'fas fa-medal'),
        (4, 'Campeão', 'Top 3 em torneio', 'fas fa-trophy'),
        (5, 'Dedicado', '15 treinos no mês', 'fas fa-bolt')
        ON CONFLICT (id_badge) DO NOTHING;
      `);
    }

    const checkUserBadges = await pool.query('SELECT 1 FROM trusted.tb_usuarios_badges LIMIT 1');
    if (checkUserBadges.rowCount === 0) {
      console.log('--- [SEED] Atribuindo badges aos membros ---');
      await pool.query(`
        INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge, dt_conquista)
        SELECT 
          u.id_usuario,
          (1 + floor(random() * 5))::int,
          NOW() - (floor(random() * 30) * INTERVAL '1 day')
        FROM trusted.tb_usuarios u
        WHERE u.id_usuario != 1
        ON CONFLICT DO NOTHING;
      `);
    }

    console.log('--- Migrações Concluídas com Sucesso ---');
  } catch (err) {
    console.error('❌ ERRO NAS MIGRAÇÕES:', err);
  }
};

// Configuração do Banco de Dados (Postgres)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
};

// Middleware para verificar se o usuário é ADMIN
const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT flg_admin FROM trusted.tb_usuarios WHERE id_usuario = $1', [req.user.id]);
    if (result.rows.length > 0 && result.rows[0].flg_admin) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao verificar privilégios.' });
  }
};

// --- ROTAS DA API ---

// Perfil do Usuário Logado
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.dsc_email, 
        u.flg_admin,
        p.dsc_nome_completo, 
        p.dsc_lateralidade, 
        p.dsc_empunhadura, 
        p.dsc_nivel_tecnico, 
        p.dsc_objetivo, 
        p.dsc_metas, 
        p.num_altura_cm, 
        p.num_peso_kg,
        p.dt_nascimento,
        p.dsc_foto_perfil,
        p.num_skill_forehand,
        p.num_skill_backhand,
        p.num_skill_cozinhada,
        p.num_skill_topspin,
        p.num_skill_saque,
        p.num_skill_rally,
        p.num_skill_ataque,
        p.num_skill_defesa,
        p.num_skill_bloqueio,
        p.num_skill_controle,
        p.num_skill_movimentacao,
        p.dsc_mensagem_mentor,
        u.flg_admin,
        u.dt_criacao_registro
      FROM trusted.tb_usuarios u
      LEFT JOIN trusted.tb_membros_perfil p ON u.id_usuario = p.id_usuario
      WHERE u.id_usuario = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao buscar perfil.' });
  }
});

// Atualizar Perfil do Usuário
app.put('/api/update-profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, weight, height, lateralidade, grip, level, goals, mentor_message, birth } = req.body;
    const userId = req.user.id;

    // Atualiza dados biomecânicos e técnicos (Estado Atual)
    const oldProfileRes = await client.query('SELECT * FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
    const oldData = oldProfileRes.rows[0];

    // 1. Registrar no RAW (Auditoria Obrigatória)
    await client.query(
      `INSERT INTO raw.tb_perfil_atualizacoes (id_usuario, jsn_payload_antigo, jsn_payload_novo) 
       VALUES ($1, $2, $3)`,
      [userId, JSON.stringify(oldData), JSON.stringify(req.body)]
    );

    // 2. Atualizar TRUSTED (Estado Atual)
    await client.query(
      `UPDATE trusted.tb_membros_perfil 
       SET dsc_nome_completo = $1, 
           num_peso_kg = $2, 
           num_altura_cm = $3, 
           dsc_lateralidade = $4,
           dsc_empunhadura = $5,
           dsc_nivel_tecnico = $6, 
           dsc_metas = $7, 
           dsc_mensagem_mentor = $8, 
           dt_nascimento = $9, 
           dt_atualizacao = CURRENT_TIMESTAMP
       WHERE id_usuario = $10`,
      [name, weight, height, lateralidade, grip, level, goals, mentor_message, birth || null, userId]
    );

    // 3. Registrar Evolução (Histórico se houve mudança de peso/nível)
    if (oldData.num_peso_kg !== weight || oldData.dsc_nivel_tecnico !== level) {
      await client.query(
        `INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_peso_kg, num_altura_cm, dsc_nivel_tecnico) 
         VALUES ($1, $2, $3, $4)`,
        [userId, weight, height, level]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar perfil.' });
  } finally {
    client.release();
  }
});

// Alterar Senha
app.put('/api/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 1. Buscar a senha atual
    const userRes = await pool.query('SELECT dsc_senha_hash FROM trusted.tb_usuarios WHERE id_usuario = $1', [userId]);
    const user = userRes.rows[0];

    // 2. Validar senha atual
    const isMatch = await bcrypt.compare(currentPassword, user.dsc_senha_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta.' });
    }

    // 3. Gerar novo hash e salvar
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE trusted.tb_usuarios SET dsc_senha_hash = $1 WHERE id_usuario = $2', [newHashedPassword, userId]);

    res.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao alterar senha.' });
  }
});

// Rota Raiz removida (duplicada no topo)

// Rota de Teste de Conexão
app.get('/api/health', (req, res) => {
  res.json({ status: 'API Online', message: 'Spin4All Portal API rodando com sucesso!' });
});

// --- FLUXO DE AUTENTICAÇÃO ---

// Registro de Usuário + Perfil (Caminho RAW -> TRUSTED)
app.post('/api/register', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, password, profileData } = req.body;

    // 1. Salvar na camada RAW (Auditoria)
    await client.query(
      'INSERT INTO raw.tb_onboarding_submissions (jsn_payload) VALUES ($1)',
      [JSON.stringify(req.body)]
    );

    // 2. Criar Usuário na TRUSTED
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      'INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash) VALUES ($1, $2) RETURNING id_usuario',
      [email, hashedPassword]
    );

    const userId = userRes.rows[0].id_usuario;

    // 3. Criar Perfil na TRUSTED (Estado Atual)
    await client.query(`
        INSERT INTO trusted.tb_membros_perfil 
          (id_usuario, dsc_nome_completo, dt_nascimento, num_altura_cm, num_peso_kg, num_telefone, vlr_lateralidade, dsc_empunhadura, dsc_nivel_tecnico, dsc_objetivo, dsc_metas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        userId, 
        profileData.name, 
        profileData.birthDate || null, 
        profileData.height, 
        profileData.weight,
        profileData.phone || '',
        profileData.lateralidade || 'Destro',
        profileData.grip || 'Clássica',
        profileData.level, 
        profileData.objective, 
        profileData.goals
      ]);

    // 4. Iniciar Histórico de Evolução (Ponto de Partida)
    await client.query(
      `INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_peso_kg, num_altura_cm, dsc_nivel_tecnico) 
       VALUES ($1, $2, $3, $4)`,
      [userId, profileData.weight, profileData.height, profileData.level]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Membro registrado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao registrar membro.' });
  } finally {
    client.release();
  }
});

// Login do Portal
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.dsc_senha_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
    }

    // Gerar Token JWT
    const token = jwt.sign({ id: user.id_usuario, admin: user.flg_admin }, process.env.JWT_SECRET, { expiresIn: '8h' });

    // GARANTIR QUE PERFIL EXISTA: Se for um admin via bootstrap, pode não ter perfil.
    // Criamos um perfil básico se não existir para evitar erros no dashboard.
    await pool.query(`
      INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_usuario) DO NOTHING
    `, [user.id_usuario, email.split('@')[0], 'Iniciante']);

    // Atualizar último login e incrementar contador de interação
    await pool.query('UPDATE trusted.tb_usuarios SET dt_ultimo_login = CURRENT_TIMESTAMP, num_logins = num_logins + 1 WHERE id_usuario = $1', [user.id_usuario]);

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro no servidor.' });
  }
});

// --- SISTEMA DE CHECK-IN ---

// Realizar Check-in (Tablet)
app.post('/api/checkin', authenticateToken, isAdmin, async (req, res) => {
  const { email, id_usuario } = req.body;
  try {
    let userId = id_usuario;
    let userName = '';

    if (!userId && email) {
      // Buscar usuário pelo e-mail se o ID não for fornecido
      const userRes = await pool.query('SELECT u.id_usuario, p.dsc_nome_completo FROM trusted.tb_membros_perfil p JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario WHERE u.dsc_email = $1', [email]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Membro não encontrado.' });
      }
      userId = userRes.rows[0].id_usuario;
      userName = userRes.rows[0].dsc_nome_completo;
    } else if (userId) {
      // Apenas buscar o nome para o feedback se o ID for fornecido
      const nameRes = await pool.query('SELECT dsc_nome_completo FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
      userName = nameRes.rows[0]?.dsc_nome_completo || 'Membro';
    } else {
      return res.status(400).json({ success: false, message: 'E-mail ou ID de usuário é obrigatório.' });
    }

    // 2. Registrar Check-in
    await pool.query(
      'INSERT INTO trusted.tb_checkins (id_usuario) VALUES ($1)',
      [userId]
    );

    res.json({ success: true, message: `Presença confirmada, ${userName.split(' ')[0]}!` });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ success: false, message: 'Check-in já realizado hoje.' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao processar check-in.' });
  }
});

// Listagem de Membros para Check-in Visual (Tablet)
app.get('/api/checkin-list', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_usuario, 
        p.dsc_nome_completo,
        EXISTS (
          SELECT 1 FROM trusted.tb_checkins c
          WHERE c.id_usuario = p.id_usuario AND c.dt_checkin = CURRENT_DATE
        ) as flg_presente
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario
      WHERE u.vlr_status_conta = 'ativo'
      ORDER BY p.dsc_nome_completo ASC
    `);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar lista de membros.' });
  }
});

// Remover Check-in (Undo)
app.delete('/api/checkin', authenticateToken, isAdmin, async (req, res) => {
  const { id_usuario } = req.body;
  try {
    const result = await pool.query(
      'DELETE FROM trusted.tb_checkins WHERE id_usuario = $1 AND dt_checkin = CURRENT_DATE',
      [id_usuario]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Nenhum check-in encontrado para hoje.' });
    }

    res.json({ success: true, message: 'Presença removida com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao remover check-in.' });
  }
});

// Buscar Minha Frequência (Dashboard)
app.get('/api/my-attendance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Dados consolidado de frequência
    const statsRes = await pool.query('SELECT * FROM refined.vw_frequencia_mensal WHERE id_usuario = $1', [userId]);
    
    res.json({ 
      success: true, 
      stats: statsRes.rows[0] || { num_presencas: 0, pct_frequencia: 0, dsc_status_torneio: 'Pendente ❌' },
      dates: datesRes.rows.map(r => r.dt_checkin)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar dados de frequência.' });
  }
});

// --- ÁREA ADMINISTRATIVA (ADMIN ONLY) ---

// Relatório Consolidado (Dash Admin)
app.get('/api/admin/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Total de Membros
    const totalMembros = await pool.query('SELECT COUNT(*) FROM trusted.tb_membros_perfil');
    
    // 2. Check-ins de hoje
    const checkinsHoje = await pool.query('SELECT COUNT(*) FROM trusted.tb_checkins WHERE dt_checkin = CURRENT_DATE');
    
    // 3. Distribuição por Nível (View Refined)
    const niveisDist = await pool.query('SELECT * FROM refined.vw_segmentacao_nivel');
    
    // 4. Histórico de Check-ins (View Refined) - Aumentado para 14 dias
    const checkinsHist = await pool.query('SELECT * FROM refined.vw_checkins_stats LIMIT 14');

    // 5. Demografia (View Refined)
    const demografia = await pool.query('SELECT * FROM refined.vw_analytics_demografico');

    // 6. Demografia por Faixas Etárias (NOVO)
    const demografiaFaixas = await pool.query(`
      SELECT 
        dsc_nivel_tecnico,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(dt_nascimento)) < 20 THEN '< 20'
          WHEN EXTRACT(YEAR FROM AGE(dt_nascimento)) BETWEEN 20 AND 29 THEN '20-29'
          WHEN EXTRACT(YEAR FROM AGE(dt_nascimento)) BETWEEN 30 AND 39 THEN '30-39'
          WHEN EXTRACT(YEAR FROM AGE(dt_nascimento)) BETWEEN 40 AND 49 THEN '40-49'
          ELSE '50+'
        END as faixa_etaria,
        COUNT(*) as count
      FROM trusted.tb_membros_perfil
      GROUP BY dsc_nivel_tecnico, faixa_etaria
      ORDER BY faixa_etaria
    `);

    res.json({
      success: true,
      data: {
        total_membros: parseInt(totalMembros.rows[0].count),
        ativos_hoje: parseInt(checkinsHoje.rows[0].count),
        distribuicao_niveis: niveisDist.rows,
        historico_checkins: checkinsHist.rows,
        demografia: demografia.rows,
        demografia_faixas: demografiaFaixas.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao gerar relatórios administrativos.' });
  }
});

// Listar Todos os Membros (Gestão)
app.get('/api/admin/members', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_usuario, u.dsc_email, u.flg_admin, u.vlr_status_conta,
        p.dsc_nome_completo, p.dsc_nivel_tecnico, p.dt_nascimento, p.num_telefone
      FROM trusted.tb_usuarios u
      JOIN trusted.tb_membros_perfil p ON u.id_usuario = p.id_usuario
      ORDER BY p.dsc_nome_completo ASC
    `);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao listar membros.' });
  }
});

// Alternar Status de Admin (Gestão de Acessos)
app.put('/api/admin/toggle-admin', authenticateToken, isAdmin, async (req, res) => {
  const { id_usuario, flg_admin } = req.body;
  const adminId = req.user.id;

  try {
    // Impedir auto-bloqueio
    if (id_usuario === adminId) {
      return res.status(400).json({ success: false, message: 'Você não pode remover suas próprias permissões de administrador.' });
    }

    await pool.query(
      'UPDATE trusted.tb_usuarios SET flg_admin = $1 WHERE id_usuario = $2',
      [flg_admin, id_usuario]
    );

    res.json({ success: true, message: `Status de administrador ${flg_admin ? 'concedido' : 'revogado'} com sucesso!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar permissões.' });
  }
});

// MÃ©tricas de ProgressÃ£o ComunitÃ¡ria (PÃºblicas)
app.get('/api/community/progression', authenticateToken, async (req, res) => {
  try {
    const query = `
      WITH current_avg AS (
        SELECT id_usuario, dsc_nivel_tecnico,
               CASE 
                 WHEN dsc_nivel_tecnico = 'Iniciante' THEN 1
                 WHEN dsc_nivel_tecnico = 'IntermediÃ¡rio' THEN 2
                 ELSE 3
               END as level_val
        FROM trusted.tb_membros_perfil
      ),
      last_week_avg AS (
        SELECT id_usuario, num_skill_avg_total
        FROM trusted.tb_membros_evolucao
        WHERE dt_registro = (CURRENT_DATE - INTERVAL '7 days')::date
      )
      SELECT 
        COUNT(*) filter (WHERE i > 0) as subiram,
        COUNT(*) as total
      FROM (
        SELECT u.id_usuario, 
               (floor(random() * 5)) as i -- SimulaÃ§Ã£o de progressÃ£o semanal para o gráfico
        FROM trusted.tb_usuarios u
      ) s
    `;
    const result = await pool.query(query);
    const subiram = parseInt(result.rows[0].subiram);
    const total = parseInt(result.rows[0].total) || 1;
    res.json({ success: true, progression_rate: ((subiram/total) * 100).toFixed(1) });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// MÃ©tricas AvanÃ§adas Administrativas (Churn & PresenÃ§a 14 dias)
app.get('/api/admin/advanced-metrics', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Churn > 3 dias (Inatividade Rigorosa)
    const churnData = await pool.query(`
      SELECT p.dsc_nome_completo, 
             MAX(c.dt_checkin) as ultimo_checkin,
             CURRENT_DATE - MAX(c.dt_checkin) as dias_inativo
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario
      GROUP BY p.dsc_nome_completo
      HAVING CURRENT_DATE - MAX(c.dt_checkin) > 3
      ORDER BY dias_inativo DESC
      LIMIT 10
    `);

    // 2. Ranking de Presença (Últimos 14 dias com Foto)
    const attendanceRanking = await pool.query(`
      SELECT p.dsc_nome_completo, p.dsc_foto_perfil, COUNT(c.id_checkin) as total_treinos
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario
      WHERE c.dt_checkin >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY p.dsc_nome_completo, p.dsc_foto_perfil
      ORDER BY total_treinos DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      churn: churnData.rows,
      attendance: attendanceRanking.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});



// Helper: Registrar Snapshot de Skills para EvoluÃ§Ã£o
async function recordSkillSnapshot(userId, skills) {
  const avg = (
      skills.forehand + skills.backhand + skills.cozinhada + skills.topspin + 
      skills.saque + skills.rally + skills.ataque + skills.defesa + 
      skills.bloqueio + skills.controle + skills.movimentacao
  ) / 11;
  
  await pool.query(
    'INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total) VALUES ($1, $2)',
    [userId, avg]
  );
}

// Salvar Habilidades TÃ©cnicas (Sliders)
app.post('/api/user/save-skills', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const s = req.body;
  
  try {
    await pool.query(`
      UPDATE trusted.tb_membros_perfil SET
        num_skill_forehand = $1, num_skill_backhand = $2, num_skill_cozinhada = $3,
        num_skill_topspin = $4, num_skill_saque = $5, num_skill_rally = $6,
        num_skill_ataque = $7, num_skill_defesa = $8, num_skill_bloqueio = $9,
        num_skill_controle = $10, num_skill_movimentacao = $11,
        dt_atualizacao = CURRENT_TIMESTAMP
      WHERE id_usuario = $12
    `, [s.forehand, s.backhand, s.cozinhada, s.topspin, s.saque, s.rally, s.ataque, s.defesa, s.bloqueio, s.controle, s.movimentacao, userId]);

    await recordSkillSnapshot(userId, s);
    res.json({ success: true, message: 'Skills atualizadas!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao salvar skills.' });
  }
});

// Resumo de Objetivos (Admin Only)
app.get('/api/admin/objectives-summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        dsc_objetivo, COUNT(*) as qtd,
        STRING_AGG(dsc_metas, ' | ') FILTER (WHERE dsc_metas IS NOT NULL) as amostra_metas
      FROM trusted.tb_membros_perfil
      GROUP BY dsc_objetivo
      ORDER BY qtd DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao resumir objetivos.' });
  }
});

// --- NOVOS ENDPOINTS DASHBOARD PREMIUM ---

// Salvar Percepção de Mobilidade
app.post('/api/user/save-mobility', authenticateToken, async (req, res) => {
  const { score } = req.body;
  const userId = req.user.id;
  try {
    await pool.query(
      'INSERT INTO trusted.tb_usuarios_metas_historico (id_usuario, num_score_mobilidade) VALUES ($1, $2) ON CONFLICT (id_usuario, dt_referencia) DO UPDATE SET num_score_mobilidade = EXCLUDED.num_score_mobilidade',
      [userId, score]
    );
    res.json({ success: true, message: 'Mobilidade registrada!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao salvar mobilidade.' });
  }
});

// Dados para Calendário Mensal
app.get('/api/user/attendance-calendar', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query; // Ex: ?month=3&year=2024
  
  try {
    const result = await pool.query(
      'SELECT dt_checkin FROM trusted.tb_checkins WHERE id_usuario = $1 AND EXTRACT(MONTH FROM dt_checkin) = $2 AND EXTRACT(YEAR FROM dt_checkin) = $3',
      [userId, month, year]
    );
    res.json({ success: true, dates: result.rows.map(r => r.dt_checkin) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar calendário.' });
  }
});

// Ranking Hall da Fama (Pontos de Torneio - Ãšltimos 12 Meses)
app.get('/api/user/hall-fama', authenticateToken, async (req, res) => {
  try {
    const query = `SELECT * FROM refined.vw_hall_fama LIMIT 5`;
    const result = await pool.query(query);
    res.json({ success: true, ranking: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar Hall da Fama.' });
  }
});

// Ranking de EvoluÃ§Ã£o (Mensal)
app.get('/api/user/evolution-ranking', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM refined.vw_ranking_evolucao LIMIT 5');
    res.json({ success: true, ranking: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao gerar ranking de evoluÃ§Ã£o.' });
  }
});

// Buscar Badges do UsuÃ¡rio
app.get('/api/user/badges', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT bd.dsc_nome, bd.dsc_descricao, bd.dsc_icone, ub.dt_conquista
      FROM trusted.tb_usuarios_badges ub
      JOIN trusted.tb_badges_definicao bd ON ub.id_badge = bd.id_badge
      WHERE ub.id_usuario = $1
      ORDER BY ub.dt_conquista DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json({ success: true, badges: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar badges.' });
  }
});

// Indicadores da Comunidade (Para a Home)
app.get('/api/community/stats', authenticateToken, async (req, res) => {
  try {
    const levels = await pool.query('SELECT * FROM refined.vw_segmentacao_nivel');
    const activeToday = await pool.query('SELECT COUNT(*) as count FROM trusted.tb_checkins WHERE dt_checkin = CURRENT_DATE');
    
    // NOVO: Engajamento Semanal (Últimos 7 dias)
    const weeklyEngagement = await pool.query(`
      SELECT 
        to_char(d.day, 'DD/MM') as label,
        COALESCE(COUNT(c.id_checkin), 0) as value
      FROM (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date as day
      ) d
      LEFT JOIN trusted.tb_checkins c ON c.dt_checkin = d.day
      GROUP BY d.day
      ORDER BY d.day
    `);

    // NOVO: Foco Coletivo (Meta mais comum simplificada)
    const mainFocus = await pool.query(`
      SELECT 
        CASE 
          WHEN dsc_metas ILIKE '%torneio%' OR dsc_metas ILIKE '%competição%' THEN 'Competição'
          WHEN dsc_metas ILIKE '%físico%' OR dsc_metas ILIKE '%saúde%' THEN 'Saúde/Físico'
          WHEN dsc_metas ILIKE '%técnica%' OR dsc_metas ILIKE '%forehand%' THEN 'Técnico'
          ELSE 'Evolução Geral'
        END as focus,
        COUNT(*) as count
      FROM trusted.tb_membros_perfil
      WHERE dsc_metas IS NOT NULL
      GROUP BY focus
      ORDER BY count DESC
      LIMIT 1
    `);

    const recentActivity = await pool.query(`
      SELECT mp.dsc_nome_completo, bd.dsc_nome, bd.dsc_icone
      FROM trusted.tb_usuarios_badges ub
      JOIN trusted.tb_membros_perfil mp ON ub.id_usuario = mp.id_usuario
      JOIN trusted.tb_badges_definicao bd ON ub.id_badge = bd.id_badge
      ORDER BY ub.dt_conquista DESC LIMIT 4
    `);

    res.json({
      success: true,
      data: {
        levels: levels.rows,
        active_today: parseInt(activeToday.rows[0].count),
        weekly_engagement: weeklyEngagement.rows,
        main_focus: mainFocus.rows[0]?.focus || 'Evolução',
        recent_activity: recentActivity.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar stats da comunidade.' });
  }
});

// Ranking de Presença 14 dias (Simplificado para a Home)
app.get('/api/community/attendance-ranking', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.dsc_nome_completo, p.dsc_foto_perfil, COUNT(c.id_checkin) as total_treinos
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario
      WHERE c.dt_checkin >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY p.dsc_nome_completo, p.dsc_foto_perfil
      ORDER BY total_treinos DESC
      LIMIT 3
    `);
    res.json({ success: true, ranking: result.rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// --- INSIGHTS DO TÉCNICO (ADMIN ONLY) ---

// 1. Gargalo Técnico Coletivo (Média de Habilidades do Grupo)
app.get('/api/admin/technical-bottleneck', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        AVG(num_skill_forehand) as forehand, AVG(num_skill_backhand) as backhand,
        AVG(num_skill_cozinhada) as cozinhada, AVG(num_skill_topspin) as topspin,
        AVG(num_skill_saque) as saque, AVG(num_skill_rally) as rally,
        AVG(num_skill_ataque) as ataque, AVG(num_skill_defesa) as defesa,
        AVG(num_skill_bloqueio) as bloqueio, AVG(num_skill_controle) as controle,
        AVG(num_skill_movimentacao) as movimentacao
      FROM trusted.tb_membros_perfil
    `;
    const result = await pool.query(query);
    
    // Segmentação por Nível (3 sub-radares)
    const levelsQuery = `
      SELECT dsc_nivel_tecnico as level,
        AVG(num_skill_forehand) as forehand, AVG(num_skill_backhand) as backhand,
        AVG(num_skill_cozinhada) as cozinhada, AVG(num_skill_topspin) as topspin,
        AVG(num_skill_saque) as saque, AVG(num_skill_rally) as rally,
        AVG(num_skill_ataque) as ataque, AVG(num_skill_defesa) as defesa,
        AVG(num_skill_bloqueio) as bloqueio, AVG(num_skill_controle) as controle,
        AVG(num_skill_movimentacao) as movimentacao
      FROM trusted.tb_membros_perfil
      GROUP BY dsc_nivel_tecnico
    `;
    const levelsResult = await pool.query(levelsQuery);

    res.json({ 
      success: true, 
      data: result.rows[0],
      by_level: levelsResult.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao calcular gargalo técnico.' });
  }
});

// 2. Índice de Esforço Biomecânico (Risco de Lesão: IMC alto + Alta Frequência)
app.get('/api/admin/biomechanical-effort', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.dsc_nome_completo,
        ROUND(p.num_peso_kg / ((p.num_altura_cm/100.0)^2), 2) as imc,
        COUNT(c.id_checkin) as presencas_mes
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario AND c.dt_checkin >= CURRENT_DATE - INTERVAL '30 days'
      WHERE u.vlr_status_conta = 'ativo'
      GROUP BY p.dsc_nome_completo, p.num_peso_kg, p.num_altura_cm
      HAVING (p.num_peso_kg / ((p.num_altura_cm/100.0)^2)) > 28 AND COUNT(c.id_checkin) > 12
      ORDER BY presencas_mes DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao calcular risco biomecânico.' });
  }
});

// 3. Sparring Matrix (Sugestões de Pares Baseado em Nível e Habilidades Próximas)
app.get('/api/admin/sparring-matrix', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        dsc_nome_completo, dsc_nivel_tecnico,
        (num_skill_forehand + num_skill_backhand + num_skill_saque) / 3 as avg_skill
      FROM trusted.tb_membros_perfil
      ORDER BY dsc_nivel_tecnico, avg_skill DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao gerar matriz de sparring.' });
  }
});

// 4. Pico de Performance Mensal (Evolução Técnica - LINHAS)
app.get('/api/admin/performance-peak', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Busca os 5 membros com maior evolução média no último mês
    const topMembers = await pool.query(`
      SELECT mp.id_usuario, mp.dsc_nome_completo
      FROM trusted.tb_membros_perfil mp
      ORDER BY (num_skill_forehand + num_skill_backhand + num_skill_topspin) DESC
      LIMIT 5
    `);

    const performanceData = [];

    for (const member of topMembers.rows) {
      const history = await pool.query(`
        SELECT dt_registro, num_skill_avg_total as val
        FROM trusted.tb_membros_evolucao
        WHERE id_usuario = $1
        ORDER BY dt_registro ASC
        LIMIT 30
      `, [member.id_usuario]);

      performanceData.push({
        name: member.dsc_nome_completo,
        history: history.rows
      });
    }

    res.json({ success: true, data: performanceData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao calcular picos de performance.' });
  }
});

// 5. Alertas Biomecânicos e Gargalos Técnicos (Admin)
app.get('/api/admin/technical-bottlenecks', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Buscar membros com risco biomecânico (IMC > 28 e Treinos > 15 no mês)
    const bioRisks = await pool.query(`
      SELECT 
        mp.dsc_nome_completo,
        (mp.num_peso_kg / (mp.num_altura_cm * mp.num_altura_cm / 10000)) as imc,
        COUNT(c.id_checkin) as treinos_mes
      FROM trusted.tb_membros_perfil mp
      LEFT JOIN trusted.tb_checkins c ON mp.id_usuario = c.id_usuario 
        AND c.dt_checkin >= date_trunc('month', CURRENT_DATE)
      WHERE mp.num_peso_kg > 0 AND mp.num_altura_cm > 0
      GROUP BY mp.id_usuario, mp.dsc_nome_completo, mp.num_peso_kg, mp.num_altura_cm
      HAVING (mp.num_peso_kg / (mp.num_altura_cm * mp.num_altura_cm / 10000)) > 28
      ORDER BY treinos_mes DESC
      LIMIT 3
    `);

    // Gargalos Técnicos (Exemplo: Skills mais baixas do grupo)
    const techBottlenecks = [
      { skill: 'Saque/Recepção', impacto: 'Alto', members: 12 },
      { skill: 'Movimentação Lateral', impacto: 'Médio', members: 8 },
      { skill: 'Controle de Backhand', impacto: 'Crítico', members: 15 }
    ];

    res.json({ 
      success: true, 
      data: {
        biomechanical_risks: bioRisks.rows,
        technical_bottlenecks: techBottlenecks
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao analisar gargalos.' });
  }
});

// Endpoint de Upload de Foto de Perfil
app.post('/api/user/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Nenhuma foto enviada.' });
  }

  const userId = req.user.id;
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    await pool.query(
      'UPDATE trusted.tb_membros_perfil SET dsc_foto_perfil = $1 WHERE id_usuario = $2',
      [imageUrl, userId]
    );
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao salvar caminho da foto.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log('=============================================');
    console.log(`🚀 SERVIDOR SPIN4ALL ATIVO NA PORTA ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log('=============================================');
    
    // Executar migrações
    await runMigrations();
});
