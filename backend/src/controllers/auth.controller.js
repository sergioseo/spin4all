const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const DataIngestor = require('../services/data/ingestion/DataIngestor');
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.resolve(__dirname, '../../config/settings.json');

const register = async (req, res) => {
  // 0. CHECK LOCKDOWN
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      if (settings.registrationLocked) {
        return res.status(403).json({ success: false, message: 'CADASTRO BLOQUEADO: A comunidade está em modo de manutenção.' });
      }
    }
  } catch (e) { console.error('Erro ao ler trava de segurança:', e); }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, password, profileData } = req.body;
 
    // 0.1 Check if email already exists (BOLT: Frictionless UX)
    const emailCheck = await pool.query('SELECT 1 FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'E-mail já cadastrado no sistema.' });
    }

    // 1. Salvar na camada RAW (Auditoria Centralizada)
    await DataIngestor.ingest('onboarding', { payload: req.body });

    // 2. Criar Usuário na TRUSTED
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      'INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash, dt_aceite_termos) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id_usuario',
      [email, hashedPassword]
    );

    const userId = userRes.rows[0].id_usuario;

    // 3. Criar Perfil na TRUSTED (Estado Inicial: Pendente para Mapeamento)
    await client.query(`
        INSERT INTO trusted.tb_membros_perfil 
          (id_usuario, dsc_nome_completo, dt_nascimento, num_altura_cm, num_peso_kg, num_telefone, vlr_lateralidade, dsc_empunhadura, dsc_nivel_tecnico, dsc_objetivo, dsc_metas, flg_perfil_concluido)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)
      `, [
        userId, 
        profileData.name, 
        profileData.birthDate || null, 
        profileData.height, 
        profileData.weight,
        profileData.phone || '',
        profileData.lateralidade || 'Destro',
        profileData.grip || 'Clássica',
        profileData.level || null, // Se NULL, ativa o Card 'INICIAR AGORA'
        profileData.objective || 'Diversão', 
        profileData.goals || ''
      ]);

    // 4. Iniciar Histórico de Evolução (Ponto de Partida) - Obs: tb_membros_evolucao deve existir
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
    
    // BOLT: Handle Postgres Unique Constraint Violation (Error Code 23505)
    if (err.code === '23505') {
        return res.status(400).json({ success: false, message: 'E-mail já cadastrado no sistema.' });
    }

    res.status(500).json({ success: false, error: 'Erro ao registrar membro.' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
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

    const { rows: profileRows } = await pool.query('SELECT flg_perfil_concluido FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [user.id_usuario]);
    const flg_perfil_concluido = profileRows.length > 0 ? profileRows[0].flg_perfil_concluido : false;

    // Gerar Token JWT
    const token = jwt.sign({ id: user.id_usuario, admin: user.flg_admin }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ success: true, token, flg_perfil_concluido });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro no servidor.' });
  }
};

const googleLogin = async (req, res) => {
  const { email, name, googleId } = req.body;
  try {
    const result = await pool.query('SELECT id_usuario, flg_admin FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    let user;
    let isNew = false;

    if (result.rows.length === 0) {
      // [BOLT:SECURITY] Verificar Lockdown antes de registrar via Google
      const fs = require('fs');
      const path = require('path');
      const settingsPath = path.join(__dirname, '../../config/settings.json');
      let registrationLocked = false;
      try {
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          registrationLocked = settings.registrationLocked;
        }
      } catch (e) {
        console.error('Erro ao ler settings no Google Login:', e);
      }

      if (registrationLocked) {
        return res.status(403).json({ 
          success: false, 
          message: 'O cadastro de novos usuários está temporariamente bloqueado pela administração.' 
        });
      }

      isNew = true;
      const passDummy = await bcrypt.hash(googleId || 'google-auth-pwd', 10);
      const newUser = await pool.query(
        'INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash) VALUES ($1, $2) RETURNING id_usuario, flg_admin',
        [email, passDummy]
      );
      user = newUser.rows[0];
      
      await pool.query(
        'INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, flg_perfil_concluido) VALUES ($1, $2, FALSE) ON CONFLICT (id_usuario) DO NOTHING',
        [user.id_usuario, name]
      );
    } else {
      user = result.rows[0];
    }

    const { rows: profileRows } = await pool.query('SELECT flg_perfil_concluido FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [user.id_usuario]);
    const flg_perfil_concluido = profileRows.length > 0 ? profileRows[0].flg_perfil_concluido : false;

    const token = jwt.sign({ id: user.id_usuario, admin: user.flg_admin }, process.env.JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ 
      success: true, 
      token, 
      flg_perfil_concluido,
      isNew,
      user: { email, name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro no Google Login' });
  }
};

const checkRegistrationStatus = (req, res) => {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      return res.json({ success: true, registrationLocked: settings.registrationLocked });
    }
    res.json({ success: true, registrationLocked: false });
  } catch (e) {
    res.json({ success: true, registrationLocked: false });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  checkRegistrationStatus
};
