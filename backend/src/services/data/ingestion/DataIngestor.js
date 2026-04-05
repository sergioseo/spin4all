const pool = require('../../../config/db');
const MatchSchema = require('../../../application/schemas/MatchSchema');

/**
 * DataIngestor
 * Responsibility: Mandatory entry point for all new data. 
 * Enforces RAW-First principle by writing only to the 'raw' schema.
 */
class DataIngestor {
    /**
     * Ingest raw data into the system
     * @param {string} type - 'match', 'checkin', 'profile_update'
     * @param {Object} data - The payload
     */
    static async ingest(type, data) {
        console.log(`[DATA INGESTOR] Ingesting ${type}...`);

        // Mandatory Schema Validation (Contract Enforcement)
        if (type === 'match') {
            MatchSchema.validate(data);
        }

        try {
            switch(type) {
                case 'match':
                    // Matches são pesados. Salva apenas no Raw para processamento assíncrono.
                    return await pool.query(
                        'INSERT INTO raw.tb_torneio_matches_raw (id_torneio, jsn_payload) VALUES ($1, $2) RETURNING id_ingestion',
                        [data.id_torneio, JSON.stringify(data.payload)]
                    );

                case 'checkin':
                    // 1. RAW First
                    const rawRes = await pool.query(
                        'INSERT INTO raw.tb_checkins_raw (id_usuario, dt_checkin_original, jsn_metadata) VALUES ($1, $2, $3) RETURNING id_ingestion',
                        [data.id_usuario, data.dt_checkin || new Date(), JSON.stringify(data.metadata || {})]
                    );

                    // 2. Cascade para TRUSTED (UX imediata para check-ins)
                    // No futuro, isso pode ser movido para um worker se o volume for extremo.
                    await pool.query(
                        'INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [data.id_usuario, data.dt_checkin || new Date()]
                    );

                    return rawRes;

                case 'profile_update':
                    return await pool.query(
                        'INSERT INTO raw.tb_perfil_atualizacoes (id_usuario, jsn_payload_antigo, jsn_payload_novo) VALUES ($1, $2, $3) RETURNING id_log',
                        [data.id_usuario, JSON.stringify(data.old), JSON.stringify(data.new)]
                    );

                case 'onboarding':
                    return await pool.query(
                        'INSERT INTO raw.tb_onboarding_submissions (jsn_payload) VALUES ($1) RETURNING id_submissao',
                        [JSON.stringify(data.payload)]
                    );

                default:
                    throw new Error(`Tipo de ingestão desconhecido: ${type}`);
            }
        } catch (err) {
            console.error(`[DATA INGESTOR ERROR] Failed to ingest ${type}:`, err);
            throw err;
        }
    }
}

module.exports = DataIngestor;
