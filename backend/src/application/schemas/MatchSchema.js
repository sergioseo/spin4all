/**
 * MatchSchema
 * Mandatory contract for tournament match data.
 * Ensures data integrity before ingestion/processing.
 */
class MatchSchema {
    static validate(data) {
        const errors = [];

        if (!data.id_torneio || typeof data.id_torneio !== 'number') {
            errors.push('id_torneio é obrigatório e deve ser um número.');
        }

        if (!data.payload || typeof data.payload !== 'object') {
            errors.push('payload é obrigatório e deve ser um objeto.');
        } else {
            const p = data.payload;
            if (p.player_score === undefined) errors.push('payload.player_score é obrigatório.');
            if (p.opponent_score === undefined) errors.push('payload.opponent_score é obrigatório.');
            if (!p.id_usuario) errors.push('payload.id_usuario é obrigatório.');
        }

        if (errors.length > 0) {
            throw new Error(`[SCHEMA VALIDATION ERROR] Invalid Match Data: ${errors.join(' | ')}`);
        }

        return true;
    }
}

module.exports = MatchSchema;
