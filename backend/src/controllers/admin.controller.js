const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const getReports = async (req, res) => {
  try {
    const totalMembros = await pool.query('SELECT COUNT(*) FROM trusted.tb_membros_perfil');
    const checkinsHoje = await pool.query('SELECT COUNT(*) FROM trusted.tb_checkins WHERE dt_checkin = CURRENT_DATE');
    const niveisDist = await pool.query('SELECT * FROM refined.vw_segmentacao_nivel');
    const checkinsHist = await pool.query('SELECT * FROM refined.vw_checkins_stats LIMIT 14');
    const demografia = await pool.query('SELECT * FROM refined.vw_analytics_demografico');

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
    res.status(500).json({ success: false, error: 'Erro ao gerar relatórios administrativos.' });
  }
};

const getMembers = async (req, res) => {
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
    res.status(500).json({ success: false, error: 'Erro ao listar membros.' });
  }
};

const toggleAdmin = async (req, res) => {
  const { id_usuario, flg_admin } = req.body;
  const adminId = req.user.id;
  try {
    if (id_usuario === adminId) return res.status(400).json({ success: false, message: 'Você não pode remover suas próprias permissões.' });
    await pool.query('UPDATE trusted.tb_usuarios SET flg_admin = $1 WHERE id_usuario = $2', [flg_admin, id_usuario]);
    res.json({ success: true, message: `Status de administrador ${flg_admin ? 'concedido' : 'revogado'} com sucesso!` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar permissões.' });
  }
};

const getAdvancedMetrics = async (req, res) => {
  try {
    const churnData = await pool.query(`
      SELECT p.dsc_nome_completo, MAX(c.dt_checkin) as ultimo_checkin, CURRENT_DATE - MAX(c.dt_checkin) as dias_inativo
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario
      GROUP BY p.dsc_nome_completo
      HAVING CURRENT_DATE - MAX(c.dt_checkin) > 3
      ORDER BY dias_inativo DESC LIMIT 10
    `);
    const attendanceRanking = await pool.query(`
      SELECT p.dsc_nome_completo, p.dsc_foto_perfil, COUNT(c.id_checkin) as total_treinos
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_checkins c ON p.id_usuario = c.id_usuario
      WHERE c.dt_checkin >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY p.dsc_nome_completo, p.dsc_foto_perfil
      ORDER BY total_treinos DESC LIMIT 10
    `);
    res.json({ success: true, churn: churnData.rows, attendance: attendanceRanking.rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

const getObjectivesSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dsc_objetivo, COUNT(*) as qtd, STRING_AGG(dsc_metas, ' | ') FILTER (WHERE dsc_metas IS NOT NULL) as amostra_metas
      FROM trusted.tb_membros_perfil
      GROUP BY dsc_objetivo
      ORDER BY qtd DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao resumir objetivos.' });
  }
};

const getTechnicalBottleneck = async (req, res) => {
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
    res.json({ success: true, data: result.rows[0], by_level: levelsResult.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao calcular gargalo técnico.' });
  }
};

const getBiomechanicalEffort = async (req, res) => {
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
    res.json({ success: true, alerts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

const saveThumbnail = async (req, res) => {
  const { filename, image } = req.body;

  if (!filename || !image) {
    return res.status(400).json({ success: false, error: 'Dados insuficientes.' });
  }

  try {
    // Remove o cabeçalho data:image/jpeg;base64,
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Caminho absoluto para a pasta de vídeos
    const videoDir = path.resolve(__dirname, '../../../assets/videos');
    
    // Garante que a pasta existe (embora deva existir)
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    const filePath = path.join(videoDir, filename);
    fs.writeFileSync(filePath, buffer);

    console.log(`[ADMIN] Thumbnail salva com sucesso: ${filename}`);
    res.json({ success: true, message: `Thumbnail ${filename} salva com sucesso!` });
  } catch (err) {
    console.error('[ADMIN:ERR] Erro ao salvar thumbnail:', err.message);
    res.status(500).json({ success: false, error: 'Erro interno ao salvar arquivo.' });
  }
};

module.exports = {
  getReports,
  getMembers,
  toggleAdmin,
  getAdvancedMetrics,
  getObjectivesSummary,
  getTechnicalBottleneck,
  getBiomechanicalEffort,
  saveThumbnail,
};
