/**
 * Stage 2: Metrics
 * Responsibility: Calculate deterministic performance indicators from sanitized matches.
 */
class Metrics {
    static calculate(matches) {
        if (!matches || matches.length === 0) {
            return {
                games: 0, wins: 0, losses: 0, tournaments: 0,
                win_rate: 0, avg_point_diff: 0, avg_duration: null,
                confidence: 'BAIXA'
            };
        }

        const totalGames = matches.length;
        const wins = matches.filter(m => m.sets_won > m.sets_lost).length;
        const winRate = (wins / totalGames) * 100;
        const uniqueTournaments = new Set(matches.map(m => m.id_torneio)).size;
        
        let totalPointsDiff = 0;
        let gamesWithTime = 0;
        let totalDuration = 0;

        matches.forEach(m => {
            totalPointsDiff += (m.player_score || 0) - (m.opponent_score || 0);
            if (!m.invalidTime && m.dt_inicio && m.dt_fim) {
                gamesWithTime++;
                totalDuration += (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000;
            }
        });

        return {
            games: totalGames,
            wins: wins,
            losses: totalGames - wins,
            tournaments: uniqueTournaments,
            win_rate: Math.round(winRate),
            avg_point_diff: Number((totalPointsDiff / totalGames).toFixed(1)),
            avg_duration: gamesWithTime > 0 ? Math.round(totalDuration / gamesWithTime) : null,
            confidence: totalGames >= 6 ? 'ALTA' : (totalGames >= 3 ? 'MÉDIA' : 'BAIXA')
        };
    }
}

module.exports = Metrics;
