const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

    // Atualiza dados biomecânicos e técnicos
    await client.query(
      `UPDATE trusted.tb_membros_perfil 
       SET dsc_nome_completo = $1, num_peso_kg = $2, num_altura_cm = $3, dsc_nivel_tecnico = $4, dsc_metas = $5
       WHERE id_usuario = $6`,
      [name, weight, height, level, goals, userId]
    );

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
  res.send('🚀 Spin4All API está ativa! Acesse o portal em <a href="https://www.spin4all.com.br">www.spin4all.com.br</a>');
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

    // 3. Criar Perfil na TRUSTED
    await client.query(
      `INSERT INTO trusted.tb_membros_perfil 
       (id_usuario, dsc_nome_completo, dsc_lateralidade, dsc_empunhadura, dsc_nivel_tecnico, dsc_objetivo, dsc_metas, num_altura_cm, num_peso_kg) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId, 
        profileData.name, 
        profileData.side, 
        profileData.grip, 
        profileData.level,
        profileData.objective,
        profileData.goals,
        profileData.height, 
        profileData.weight
      ]
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
    const token = jwt.sign({ id: user.id_usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Atualizar último login
    await pool.query('UPDATE trusted.tb_usuarios SET dt_ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1', [user.id_usuario]);

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Spin4All escutando na porta ${PORT}`));
