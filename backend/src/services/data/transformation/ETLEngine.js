const pool = require('../../../config/db');
const ProcessMonitor = require('../../governance/ProcessMonitor');

/**
 * ETLEngine
 * Responsibility: Industrial processing of RAW data to TRUSTED layer.
 */
class ETLEngine {
    static async processMatches() {
        console.log('[ETL ENGINE] Start: Processing Matches...');
        const logId = await ProcessMonitor.start('ETL_MATCH_PROCESSING', 'Fetching Pending Matches');
        
        try {
            // 1. Fetching
            const pendingRes = await pool.query(
                "SELECT * FROM raw.tb_torneio_matches_raw WHERE flg_processado = FALSE LIMIT 100"
            );
            
            const rows = pendingRes.rows;
            if (rows.length === 0) {
                console.log('[ETL ENGINE] No pending matches found.');
                await ProcessMonitor.finish(logId, 'SUCCESS', { message: 'Zero rows to process' });
                return;
            }

            await ProcessMonitor.update(logId, `Processing ${rows.length} rows`, 50);

            let processedCount = 0;
            for (const row of rows) {
                const { id_raw, data_payload } = row;
                
                // 2. Transformation & Validation logic
                // (Basic check: skip if score is negative)
                if (data_payload.player_score < 0 || data_payload.opponent_score < 0) {
                    await pool.query("UPDATE raw.tb_torneio_matches_raw SET flg_processado = TRUE, dsc_error_log = 'Invalid score' WHERE id_raw = $1", [id_raw]);
                    continue;
                }

                // 3. Move to TRUSTED
                await pool.query(
                    `INSERT INTO trusted.tb_analista_torneio_partidas 
                     (id_usuario, id_torneio, player_score, opponent_score, sets_won, sets_lost, dt_inicio, dt_fim, jsn_pontos_detalhado)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT DO NOTHING`,
                    [
                        data_payload.id_usuario, data_payload.id_torneio, 
                        data_payload.player_score, data_payload.opponent_score,
                        data_payload.sets_won || 0, data_payload.sets_lost || 0,
                        data_payload.dt_inicio || new Date(), data_payload.dt_fim || new Date(),
                        JSON.stringify(data_payload.points || [])
                    ]
                );

                // 4. Mark as processed
                await pool.query("UPDATE raw.tb_torneio_matches_raw SET flg_processado = TRUE WHERE id_raw = $1", [id_raw]);
                processedCount++;
            }

            console.log(`[ETL ENGINE] Success: ${processedCount} matches processed.`);
            await ProcessMonitor.finish(logId, 'SUCCESS', { rows_processed: processedCount });

        } catch (err) {
            console.error('[ETL ENGINE] Fatal Error:', err);
            await ProcessMonitor.finish(logId, 'FAIL', { error: err.message });
            throw err;
        }
    }
}

module.exports = ETLEngine;
