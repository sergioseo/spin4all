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
      'INSERT INTO raw.onboarding_submissions (jsn_payload) VALUES ($1)',
      [JSON.stringify(req.body)]
    );

    // 2. Criar Usuário na TRUSTED
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      'INSERT INTO trusted.usuarios (dsc_email, dsc_senha_hash) VALUES ($1, $2) RETURNING id_usuario',
      [email, hashedPassword]
    );

    const userId = userRes.rows[0].id_usuario;

    // 3. Criar Perfil na TRUSTED
    await client.query(
      `INSERT INTO trusted.membros_perfil 
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
    const result = await pool.query('SELECT * FROM trusted.usuarios WHERE dsc_email = $1', [email]);
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
    await pool.query('UPDATE trusted.usuarios SET dt_ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1', [user.id_usuario]);

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor Spin4All escutando na porta ${PORT}`));
