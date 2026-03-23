const pool = require('../config/db');
const DataIngestor = require('../services/data/ingestion/DataIngestor');

const getMyAttendance = async (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  const targetDate = (month && year) ? new Date(year, month - 1, 15) : new Date();
  
  try {
    const query = `
      WITH expected_days AS (
          SELECT count(*)::float as expected
          FROM generate_series(date_trunc('month', $2::date), LEAST(CURRENT_DATE, date_trunc('month', $2::date) + INTERVAL '1 month - 1 day'), '1 day') AS d
          WHERE extract(DOW from d) IN (1, 3, 5)
      ),
      total_month_days AS (
          SELECT count(*)::float as total
          FROM generate_series(date_trunc('month', $2::date), date_trunc('month', $2::date) + INTERVAL '1 month - 1 day', '1 day') AS d
          WHERE extract(DOW from d) IN (1, 3, 5)
      ),
      user_presences AS (
          SELECT 
            count(*)::float as attended, 
            array_agg(dt_checkin ORDER BY dt_checkin DESC) as dates
          FROM trusted.tb_checkins
          WHERE id_usuario = $1
            AND dt_checkin >= date_trunc('month', $2::date)
            AND dt_checkin <= LEAST(CURRENT_DATE, date_trunc('month', $2::date) + INTERVAL '1 month - 1 day')
      )
      SELECT 
        COALESCE(attended, 0) as attended, 
        COALESCE(expected, 0) as expected, 
        COALESCE(total, 0) as total_mes,
        dates, 
        ROUND(LEAST((COALESCE(attended, 0) / NULLIF(total, 0)) * 100, 100)) as pct
      FROM expected_days, total_month_days, user_presences
    `;
    const result = await pool.query(query, [userId, targetDate]);
    const stats = result.rows[0];
    const pct = parseInt(stats.pct || 0);

    res.json({ 
      success: true, 
      stats: { 
        num_presencas: parseInt(stats.attended || 0), 
        num_esperados: parseInt(stats.expected || 0),
        num_total_mes: parseInt(stats.total_mes || 0),
        pct_frequencia: pct, 
        dsc_status_torneio: pct >= 60 ? 'QUALIFICADO' : 'NÃO QUALIFICADO' 
      },
      dates: stats.dates || []
    });
  } catch (err) {
    console.error('[ERRO FATAL NA ROTA FREQUENCIA]:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar dados de frequência.' });
  }
};

const getAttendanceCalendar = async (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  try {
    const result = await pool.query(
      'SELECT dt_checkin FROM trusted.tb_checkins WHERE id_usuario = $1 AND EXTRACT(MONTH FROM dt_checkin) = $2 AND EXTRACT(YEAR FROM dt_checkin) = $3',
      [userId, month, year]
    );
    res.json({ success: true, dates: result.rows.map(r => r.dt_checkin) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar calendário.' });
  }
};

const processCheckin = async (req, res) => {
  const { email, id_usuario } = req.body;
  try {
    let userId = id_usuario;
    let userName = '';

    if (!userId && email) {
      const userRes = await pool.query('SELECT u.id_usuario, p.dsc_nome_completo FROM trusted.tb_membros_perfil p JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario WHERE u.dsc_email = $1', [email]);
      if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Membro não encontrado.' });
      userId = userRes.rows[0].id_usuario;
      userName = userRes.rows[0].dsc_nome_completo;
    } else if (userId) {
      const nameRes = await pool.query('SELECT dsc_nome_completo FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
      userName = nameRes.rows[0]?.dsc_nome_completo || 'Membro';
    }

    // MANDATORY RAW FIRST via DataIngestor
    await DataIngestor.ingest('checkin', { 
        id_usuario: userId, 
        dt_checkin: new Date(),
        metadata: { source: 'Portal UI', ip: req.ip }
    });

    res.json({ success: true, message: `Presença confirmada, ${userName.split(' ')[0]}!` });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Check-in já realizado hoje.' });
    res.status(500).json({ success: false, error: 'Erro ao processar check-in.' });
  }
};

const deleteCheckin = async (req, res) => {
  const { id_usuario } = req.body;
  try {
    const result = await pool.query('DELETE FROM trusted.tb_checkins WHERE id_usuario = $1 AND dt_checkin = CURRENT_DATE', [id_usuario]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Nenhum check-in encontrado para hoje.' });
    res.json({ success: true, message: 'Presença removida com sucesso!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao remover check-in.' });
  }
};

const getCheckinList = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_usuario, p.dsc_nome_completo, p.dsc_foto_perfil,
        (SELECT COUNT(*) FROM trusted.tb_checkins c2 WHERE c2.id_usuario = p.id_usuario) as qtd_presenca,
        EXISTS (SELECT 1 FROM trusted.tb_checkins c WHERE c.id_usuario = p.id_usuario AND c.dt_checkin = CURRENT_DATE) as flg_presente
      FROM trusted.tb_membros_perfil p
      JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario
      WHERE u.vlr_status_conta = 'ativo'
      ORDER BY p.dsc_nome_completo ASC
    `);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar lista de membros.' });
  }
};

module.exports = {
  getMyAttendance,
  getAttendanceCalendar,
  processCheckin,
  deleteCheckin,
  getCheckinList,
};
