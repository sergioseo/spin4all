const pool = require('../config/db');

const getProgression = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) filter (WHERE i > 0) as subiram,
        COUNT(*) as total
      FROM (
        SELECT u.id_usuario, 
               (floor(random() * 5)) as i -- Simulação de progressão semanal (Mock)
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
};

const getStats = async (req, res) => {
  try {
    const levels = await pool.query('SELECT * FROM refined.vw_segmentacao_nivel');
    const activeToday = await pool.query('SELECT COUNT(*) as count FROM trusted.tb_checkins WHERE dt_checkin = CURRENT_DATE');
    
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

    const progressionRate = await pool.query(`
      SELECT ROUND((COUNT(*) FILTER (WHERE num_evolucao > 0)::float / NULLIF(COUNT(*), 0)::float) * 100) as rate 
      FROM refined.vw_ranking_evolucao
    `);

    res.json({
      success: true,
      data: {
        levels: levels.rows,
        active_today: parseInt(activeToday.rows[0].count),
        weekly_engagement: weeklyEngagement.rows,
        main_focus: mainFocus.rows[0]?.focus || 'Evolução',
        recent_activity: recentActivity.rows,
        progression_rate: parseInt(progressionRate.rows[0]?.rate || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar stats da comunidade.' });
  }
};

const getAttendanceRanking = async (req, res) => {
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
};

const getHallFama = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM refined.vw_hall_fama LIMIT 5`);
    res.json({ success: true, ranking: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar Hall da Fama.' });
  }
};

const getEvolutionRanking = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM refined.vw_ranking_evolucao LIMIT 5');
    res.json({ success: true, ranking: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao gerar ranking de evolução.' });
  }
};

module.exports = {
  getProgression,
  getStats,
  getAttendanceRanking,
  getHallFama,
  getEvolutionRanking,
};
