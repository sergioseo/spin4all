/**
 * Stage 1: Cleaner
 * Responsibility: Sanitize and filter raw tournament data.
 */
class Cleaner {
    static sanitize(matches) {
        if (!Array.isArray(matches)) return [];

        return matches.filter(m => {
            const totalSets = (m.sets_won || 0) + (m.sets_lost || 0);
            
            // 1. Regra Básica: Partida sem sets não existe tecnicamente
            if (totalSets === 0) return false;
            
            // 2. Regra de Tênis de Mesa (MD5): Máximo de 3 sets por jogador, total de 5.
            if (m.sets_won > 3 || m.sets_lost > 3 || totalSets > 5) return false;
            
            // 3. Validação Temporal (Sanity Check)
            // Se houver datas, a duração deve ser plausível (1 a 20 min por set)
            if (m.dt_inicio && m.dt_fim) {
                const durationMin = (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000;
                if (durationMin < (1 * totalSets) || durationMin > (20 * totalSets)) {
                    m.invalidTime = true; // Marca como tempo duvidoso mas mantém a partida
                }
            }

            return true;
        });
    }
}

module.exports = Cleaner;
