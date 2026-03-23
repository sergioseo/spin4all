const pool = require('../../config/db');

/**
 * AnalysisCacheService
 * Responsibility: Manage persistence and retrieval of semantic analysis results.
 */
class AnalysisCacheService {
    static async get(userId, hash) {
        const res = await pool.query(
            'SELECT jsn_resultado FROM trusted.tb_analise_cache WHERE id_usuario = $1 AND dsc_hash_input = $2 LIMIT 1',
            [userId, hash]
        );
        return res.rows.length > 0 ? res.rows[0].jsn_resultado : null;
    }

    static async set(userId, hash, confidence, result) {
        return await pool.query(
            `INSERT INTO trusted.tb_analise_cache (id_usuario, dsc_hash_input, num_confianca, jsn_resultado) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id_usuario, dsc_hash_input) DO UPDATE SET dt_calculo = CURRENT_TIMESTAMP`,
            [userId, hash, confidence, JSON.stringify(result)]
        );
    }
}

module.exports = AnalysisCacheService;
