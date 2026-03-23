const pool = require('../config/db');
const DataIngestor = require('../services/data/ingestion/DataIngestor');
const bcrypt = require('bcryptjs');

const getMe = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id_usuario as id, u.dsc_email, u.flg_admin,
        p.dsc_nome_completo, p.dt_nascimento, p.num_altura_cm, p.num_peso_kg,
        p.num_telefone, p.dsc_foto_perfil, p.dsc_lateralidade, p.dsc_empunhadura,
        p.dsc_nivel_tecnico, p.dsc_objetivo, p.dsc_metas,
        p.num_skill_forehand, p.num_skill_backhand, p.num_skill_saque,
        p.num_skill_ataque, p.num_skill_defesa, p.num_skill_controle,
        p.num_skill_movimentacao, p.num_skill_rally,
        p.num_skill_cozinhada, p.num_skill_topspin, p.num_skill_bloqueio,
        p.flg_perfil_concluido, p.flg_diagnostico_concluido,
        p.num_xp, p.flg_badge_diagnostico
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
};

const updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { 
      name, weight, height, lateralidade, grip, level, goals, mentor_message, birth,
      skills 
    } = req.body;
    const userId = req.user.id;

    const oldProfileRes = await client.query('SELECT * FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
    const oldData = oldProfileRes.rows[0];

    // CENTRALIZED RAW INGESTION
    await DataIngestor.ingest('profile_update', {
        id_usuario: userId,
        old: oldData,
        new: req.body
    });

    const sk = skills || {};
    await client.query(
      `UPDATE trusted.tb_membros_perfil 
       SET dsc_nome_completo = $1, 
           num_peso_kg = $2, 
           num_altura_cm = $3, 
           vlr_lateralidade = $4,
           dsc_empunhadura = $5,
           dsc_nivel_tecnico = $6, 
           dsc_metas = $7, 
           dsc_mensagem_mentor = $8, 
           dt_nascimento = $9, 
           num_skill_forehand = $10,
           num_skill_backhand = $11,
           num_skill_cozinhada = $12,
           num_skill_topspin = $13,
           num_skill_saque = $14,
           num_skill_rally = $15,
           num_skill_ataque = $16,
           num_skill_defesa = $17,
           num_skill_bloqueio = $18,
           num_skill_controle = $19,
           num_skill_movimentacao = $20,
           flg_perfil_concluido = TRUE,
           dt_atualizacao = CURRENT_TIMESTAMP
       WHERE id_usuario = $21`,
      [
        name || oldData.dsc_nome_completo, 
        weight || oldData.num_peso_kg, 
        height || oldData.num_altura_cm, 
        lateralidade || oldData.vlr_lateralidade, 
        grip || oldData.dsc_empunhadura, 
        level || oldData.dsc_nivel_tecnico, 
        goals || oldData.dsc_metas, 
        mentor_message || oldData.dsc_mensagem_mentor, 
        birth || oldData.dt_nascimento,
        sk.forehand ?? oldData.num_skill_forehand,
        sk.backhand ?? oldData.num_skill_backhand,
        sk.cozinhada ?? oldData.num_skill_cozinhada,
        sk.topspin ?? oldData.num_skill_topspin,
        sk.saque ?? oldData.num_skill_saque,
        sk.rally ?? oldData.num_skill_rally,
        sk.ataque ?? oldData.num_skill_ataque,
        sk.defesa ?? oldData.num_skill_defesa,
        sk.bloqueio ?? oldData.num_skill_bloqueio,
        sk.controle ?? oldData.num_skill_controle,
        sk.movimentacao ?? oldData.num_skill_movimentacao,
        userId
      ]
    );

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
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const userRes = await pool.query('SELECT dsc_senha_hash FROM trusted.tb_usuarios WHERE id_usuario = $1', [userId]);
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.dsc_senha_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta.' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE trusted.tb_usuarios SET dsc_senha_hash = $1 WHERE id_usuario = $2', [newHashedPassword, userId]);

    res.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao alterar senha.' });
  }
};

const getEffortStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT dsc_tag_tecnica as tag, SUM(num_xp_ganho) as total_xp
      FROM trusted.tb_historico_maestria
      WHERE id_usuario = $1
      GROUP BY dsc_tag_tecnica
    `, [userId]);

    res.json({ success: true, stats: result.rows });
  } catch (err) {
    console.error('[API] Erro ao buscar esforço:', err);
    res.status(500).json({ success: false });
  }
};

const saveSkills = async (req, res) => {
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

    // Helper logic included here for simplicity or could be in a Service
    const avg = (
        s.forehand + s.backhand + s.cozinhada + s.topspin + 
        s.saque + s.rally + s.ataque + s.defesa + 
        s.bloqueio + s.controle + s.movimentacao
    ) / 11;
    
    await pool.query(
      'INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total) VALUES ($1, $2)',
      [userId, avg]
    );

    res.json({ success: true, message: 'Skills atualizadas!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao salvar skills.' });
  }
};

const saveMobility = async (req, res) => {
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
};

const getBadges = async (req, res) => {
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
};

module.exports = {
  getMe,
  updateProfile,
  updatePassword,
  getEffortStats,
  saveSkills,
  saveMobility,
  getBadges,
};
