const pool = require('../../../config/db');

/**
 * DashboardServingService
 * Responsibility: Provide optimized data for the UI.
 * Connects to REFINED schema (Views/Materialized Views).
 */
class DashboardServingService {
    /**
     * Get consolidated metrics for the admin dashboard
     */
    static async getAdminSummary() {
        // Exemplo: No futuro isso pode ler de uma View Materializada no schema 'refined'
        const totalMembros = await pool.query('SELECT count(*) FROM trusted.tb_membros_perfil');
        const checkinsHoje = await pool.query('SELECT count(*) FROM trusted.tb_checkins WHERE dt_checkin = CURRENT_DATE');
        
        return {
            total_membros: parseInt(totalMembros.rows[0].count),
            ativos_hoje: parseInt(checkinsHoje.rows[0].count)
        };
    }

    /**
     * Get member-specific performance summary
     */
    static async getMemberSummary(userId) {
        // Orquestra queries do refined (segmentação, nível, evolução)
        const res = await pool.query('SELECT * FROM trusted.tb_membros_perfil WHERE id_usuario = $1', [userId]);
        return res.rows[0];
    }
}

module.exports = DashboardServingService;
