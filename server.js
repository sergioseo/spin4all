const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTA DE EMERGENCIA (TOP LEVEL) ---
app.get('/api/setup-admin-emergency', async (req, res) => {
  console.log('--- EMERGENCY ROUTE HIT ---');
  let testPool = pool;
  try {
    // Tenta uma query simples para validar conexão
    await testPool.query('SELECT 1');
  } catch (err) {
    console.log('DB_HOST falhou, tentando localhost...');
    testPool = new Pool({
      user: process.env.DB_USER,
      host: 'localhost',
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }

  try {
    const email = 'sjwseo@gmail.com';
    const tempPass = 'admin123';
    const hash = await bcrypt.hash(tempPass, 10);

    // --- BLOCO DE MIGRAÇÃO DE EMERGÊNCIA ---
    console.log('Rodando migrações de emergência...');
    await testPool.query(`
      -- Adicionar coluna flg_admin se não existir
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='trusted' AND table_name='tb_usuarios' AND column_name='flg_admin') THEN
          ALTER TABLE trusted.tb_usuarios ADD COLUMN flg_admin BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='trusted' AND table_name='tb_membros_perfil' AND column_name='dt_nascimento') THEN
          ALTER TABLE trusted.tb_membros_perfil ADD COLUMN dt_nascimento DATE;
        END IF;
      END $$;
    `);

    const userRes = await testPool.query('SELECT id_usuario FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    if (userRes.rows.length > 0) {
      await testPool.query('UPDATE trusted.tb_usuarios SET dsc_senha_hash = $1, flg_admin = true, vlr_status_conta = $2 WHERE dsc_email = $3', [hash, 'ativo', email]);
      res.send(`<h1>✅ OK: Usuário Atualizado para sjwseo@gmail.com / admin123</h1>`);
    } else {
      const newRes = await testPool.query('INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash, flg_admin, vlr_status_conta) VALUES ($1, $2, true, $3) RETURNING id_usuario', [email, hash, 'ativo']);
      const newId = newRes.rows[0].id_usuario;
      await testPool.query('INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico) VALUES ($1, $2, $3)', [newId, 'Admin Sergio', 'Avançado']);
      res.send(`<h1>✅ OK: Novo Admin Criado (sjwseo@gmail.com / admin123)</h1>`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('ERR: ' + err.message);
  } finally {
    if (testPool !== pool) await testPool.end();
  }
});

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
        p.dsc_nome_completo, 
        p.dsc_lateralidade, 
        p.dsc_empunhadura, 
        p.dsc_nivel_tecnico, 
        p.dsc_objetivo, 
        p.dsc_metas, 
        p.num_altura_cm, 
        p.num_peso_kg,
        p.dt_nascimento,
        u.flg_admin,
        u.dt_criacao_registro
      FROM trusted.tb_usuarios u
      JOIN trusted.tb_membros_perfil p ON u.id_usuario = p.id_usuario
      WHERE u.id_usuario = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao buscar perfil.' });
  }
});

// Atualizar Perfil do Usuário
app.put('/api/update-profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, weight, height, level, goals } = req.body;
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
       SET dsc_nome_completo = $1, num_peso_kg = $2, num_altura_cm = $3, dsc_nivel_tecnico = $4, dsc_metas = $5, dt_nascimento = $6, dt_atualizacao = CURRENT_TIMESTAMP
       WHERE id_usuario = $7`,
      [name, weight, height, level, goals, req.body.birth || null, userId]
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

// Rota Raiz (Evita o "Cannot GET /")
app.get('/', (req, res) => {
  res.send('🚀 Spin4All API está ativa! Version: ' + Date.now());
});

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
    await client.query(
      `INSERT INTO trusted.tb_membros_perfil 
       (id_usuario, dsc_nome_completo, dt_nascimento, dsc_lateralidade, dsc_empunhadura, dsc_nivel_tecnico, dsc_objetivo, dsc_metas, num_altura_cm, num_peso_kg) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId, 
        profileData.name, 
        profileData.birthDate || null,
        profileData.side, 
        profileData.grip, 
        profileData.level,
        profileData.objective,
        profileData.goals,
        profileData.height, 
        profileData.weight
      ]
    );

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

    // Atualizar último login
    await pool.query('UPDATE trusted.tb_usuarios SET dt_ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1', [user.id_usuario]);

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
      const userRes = await pool.query('SELECT id_usuario, dsc_nome_completo FROM trusted.tb_membros_perfil p JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario WHERE u.dsc_email = $1', [email]);
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
          SELECT 1 FROM trusted.tb_checkins 
          WHERE id_usuario = p.id_usuario AND dt_checkin = CURRENT_DATE
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
    
    // 4. Histórico de Check-ins (View Refined)
    const checkinsHist = await pool.query('SELECT * FROM refined.vw_checkins_stats LIMIT 7');

    // 5. Demografia (View Refined)
    const demografia = await pool.query('SELECT * FROM refined.vw_analytics_demografico');

    res.json({
      success: true,
      data: {
        total_membros: parseInt(totalMembros.rows[0].count),
        ativos_hoje: parseInt(checkinsHoje.rows[0].count),
        distribuicao_niveis: niveisDist.rows,
        historico_checkins: checkinsHist.rows,
        demografia: demografia.rows
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
        p.dsc_nome_completo, p.dsc_nivel_tecnico, p.dt_nascimento
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('=============================================');
    console.log(`🚀 SERVIDOR SPIN4ALL ATIVO NA PORTA ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log('=============================================');
});
