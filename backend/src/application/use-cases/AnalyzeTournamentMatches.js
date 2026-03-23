const pool = require('../../config/db');
const AnalysisService = require('../../services/analysis/AnalysisService');
const ProcessMonitor = require('../../services/governance/ProcessMonitor');

/**
 * AnalyzeTournamentMatches UseCase
 * Orchestrates the full tournament analysis process for a user.
 */
class AnalyzeTournamentMatches {
    static async execute(userId) {
        console.log(`[USE CASE] Executing AnalyzeTournamentMatches for user: ${userId}`);
        const logId = await ProcessMonitor.start('AI_TOURNAMENT_ANALYSIS', 'Fetching Trusted Data');

        try {
            // 1. Data Retrieval
            const matchesRes = await pool.query(`
                SELECT 
                    id_partida, id_torneio, player_score, opponent_score, sets_won, sets_lost,
                    dt_inicio, dt_fim, jsn_pontos_detalhado
                FROM trusted.tb_analista_torneio_partidas
                WHERE id_usuario = $1
                ORDER BY dt_inicio DESC
            `, [userId]);

            const rawMatches = matchesRes.rows;

            if (rawMatches.length === 0) {
                await ProcessMonitor.finish(logId, 'SUCCESS', { message: 'Zero matches to analyze' });
                return { has_tournament_data: false };
            }

            // 2. Core Analysis (The Pipeline)
            await ProcessMonitor.update(logId, 'Running 4-Stage AI Pipeline', 40);
            const analysis = await AnalysisService.getFullAnalysis(userId, rawMatches);

            // 3. Side Effects (Missions)
            await ProcessMonitor.update(logId, 'Synchronizing Missions', 80);
            await this._syncMissions(userId, analysis);

            await ProcessMonitor.finish(logId, 'SUCCESS', { hash: analysis.hash });

            return {
                success: true,
                has_tournament_data: true,
                ...analysis
            };

        } catch (err) {
            console.error('[USE CASE ERROR] AnalyzeTournamentMatches failed:', err);
            await ProcessMonitor.finish(logId, 'FAIL', { error: err.message });
            throw err;
        }
    }

    /**
     * Private Orchestration: Mission Synchronization
     */
    static async _syncMissions(userId, analysis) {
        try {
            await pool.query("DELETE FROM trusted.tb_missoes_usuario WHERE id_usuario = $1 AND dsc_categoria = 'Analista' AND flg_concluida = FALSE", [userId]);
            const { flags, scenario } = analysis;
            const missionsToInsert = [];
            
            if (flags.some(f => f.id === 'STAMINA')) {
                missionsToInsert.push({ title: 'Resistência Técnica', desc: 'Realizar 5 min de Falkenberg Drill focado em movimentação.', xp: 40, tag: 'Movimentação' });
            }
            if (flags.some(f => f.id === 'AGRESSIVO')) {
                missionsToInsert.push({ title: 'Controle de Ataque', desc: 'Praticar saque curto seguido de ataque de 3ª bola (10x).', xp: 50, tag: 'Ataque' });
            }
            
            if (missionsToInsert.length < 2) {
                if (scenario.id === 'T3') missionsToInsert.push({ title: 'Foco em Transição', desc: 'Treinar transição Forehand/Backhand em série de 3 min.', xp: 30, tag: 'Tático' });
                else missionsToInsert.push({ title: 'Fundamento Base', desc: 'Dedicar 15 min do próximo treino apenas para controle de mesa.', xp: 20, tag: 'Controle' });
            }

            for (const m of missionsToInsert.slice(0, 2)) {
                await pool.query(`
                    INSERT INTO trusted.tb_missoes_usuario (id_usuario, dsc_titulo, dsc_descricao, dsc_categoria, dt_limite, num_xp_recompensa, dsc_tag_tecnica)
                    VALUES ($1, $2, $3, 'Analista', CURRENT_DATE + INTERVAL '3 days', $4, $5)
                `, [userId, m.title, m.desc, m.xp, m.tag]);
            }
        } catch (err) {
            console.error('[USE CASE ERROR] Mission Sync failed:', err);
            // Non-blocking error for the main analysis
        }
    }
}

module.exports = AnalyzeTournamentMatches;
