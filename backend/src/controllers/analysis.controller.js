const pool = require('../config/db');
const AnalyzeTournamentMatches = require('../application/use-cases/AnalyzeTournamentMatches');

const getTournamentSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. EXECUTION VIA USE CASE (Orchestration Layer)
    const result = await AnalyzeTournamentMatches.execute(userId);

    // 2. Scenario specific fallback (Managed by UI if needed, but keeping JSON consistency)
    if (!result.has_tournament_data) {
      const profileRes = await pool.query('SELECT * FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
      const p = profileRes.rows[0] || {};
      const skills = {
        forehand: p.num_skill_forehand || 0,
        backhand: p.num_skill_backhand || 0,
        saque: p.num_skill_saque || 0,
        consistency: p.num_skill_rally || 1, // Avoid 0 for metrics calc
        ataque: p.num_skill_ataque || 0,
        defesa: p.num_skill_defesa || 0,
        movimentacao: p.num_skill_movimentacao || 0
      };
      
      return res.json({
        success: true,
        has_tournament_data: false,
        metrics: { games: 0, win_rate: 0, confidence: 'BAIXA' },
        scenario: { id: 'F2', title: 'Aguardando Competição', desc: 'Conclua seu primeiro torneio para liberar a análise avançada.' },
        diagnostic_fallback: { skills }
      });
    }

    // 3. Success Response
    res.json(result);

  } catch (err) {
    console.error('[ANALYSIS CONTROLLER] Fatal Error:', err);
    res.status(500).json({ success: false, error: 'Erro ao processar análise avançada.' });
  }
};
const getEvolution = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT 
        id_diagnostico, dt_referencia, num_score_geral, dsc_perfil_estilo,
        num_skill_forehand, num_skill_backhand, num_skill_saque,
        num_skill_consistency, num_skill_ataque, num_skill_defesa,
        num_skill_controle, num_skill_movimentacao,
        num_skill_cozinhada, num_skill_topspin, num_skill_bloqueio
      FROM trusted.tb_diagnostico_historico
      WHERE id_usuario = $1
      ORDER BY dt_referencia ASC
    `, [userId]);
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico de evolução.' });
  }
};

module.exports = {
  getTournamentSummary,
  getEvolution,
};
