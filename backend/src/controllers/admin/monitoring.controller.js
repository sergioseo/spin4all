const pool = require('../../config/db');
const QueueManager = require('../../infrastructure/queue/QueueManager');

/**
 * MonitoringController
 * Exposes system telemetry and process orchestration status.
 */
class MonitoringController {
    /**
     * Trigger a new ETL process via BullMQ
     */
    static async triggerETL(req, res) {
        console.log(`[DEBUG] triggerETL chamado por: ${req.user.email}`);
        try {
            await QueueManager.addJob('main_orchestrator', 'ETL_MATCHES', { 
                triggered_by: req.user.email 
            });
            res.json({ success: true, message: 'Processo ETL enfileirado com sucesso.' });
        } catch (err) {
            console.error('[MONITORING] Trigger failure:', err);
            res.status(500).json({ 
                success: false, 
                error: `[V9.1] Falha ao disparar orquestração: ${err.message}` 
            });
        }
    }

    /**
     * Trigger a new AI Analysis process via BullMQ
     */
    static async triggerAnalysis(req, res) {
        console.log(`[DEBUG] triggerAnalysis chamado por: ${req.user.email}`);
        try {
            await QueueManager.addJob('main_orchestrator', 'AI_ANALYSIS', { 
                triggered_by: req.user.email,
                scope: 'global_community'
            });
            res.json({ success: true, message: 'Análise AI enfileirada com sucesso.' });
        } catch (err) {
            console.error('[MONITORING] Analysis trigger failure:', err);
            res.status(500).json({ 
                success: false, 
                error: `Falha ao disparar análise: ${err.message}` 
            });
        }
    }

    /**
     * Clear all entries from the process_logs table.
     */
    static async clearLogs(req, res) {
        try {
            await pool.query('DELETE FROM governance.process_logs');
            res.json({ success: true, message: 'Logs cleared successfully' });
        } catch (err) {
            console.error('[MONITORING] Error clearing logs:', err);
            res.status(500).json({ success: false, error: `Failed to clear logs: ${err.message}` });
        }
    }

    /**
     * Get the status of all recent background processes
     */
    static async getGlobalStatus(req, res) {
        try {
            // Fetch last 20 processes
            const result = await pool.query(`
                SELECT 
                    id, process_name, step_name, status, progress, metadata,
                    dt_started, dt_updated
                FROM governance.process_logs
                ORDER BY dt_updated DESC
                LIMIT 20
            `);

            // Aggregate some stats (for today)
            const statsRes = await pool.query(`
                SELECT 
                    count(*) as total,
                    count(*) FILTER (WHERE status = 'SUCCESS') as success,
                    count(*) FILTER (WHERE status = 'FAIL') as fail,
                    count(*) FILTER (WHERE status = 'WORKING') as working
                FROM governance.process_logs
                WHERE dt_started >= CURRENT_DATE
            `);

            res.json({
                success: true,
                processes: result.rows,
                today_stats: statsRes.rows[0]
            });
        } catch (err) {
            console.error('[MONITORING CONTROLLER] Error:', err);
            res.status(500).json({ success: false, error: 'Erro ao buscar telemetria.' });
        }
    }
}

module.exports = MonitoringController;
