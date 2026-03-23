/**
 * Stage 3: Aggregator
 * Responsibility: Assign qualitative scenarios and behavioral flags (Stamina, Aggressiveness).
 */
class Aggregator {
    static aggregate(metrics, matches) {
        let flags = [];
        let scenario = null;

        // 1. Lógica de Stamina (Resistência)
        const withTime = matches.filter(m => !m.invalidTime && m.dt_inicio && m.dt_fim);
        const longGames = withTime.filter(m => (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000 > 25);
        const shortGames = withTime.filter(m => (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000 <= 25);

        if (longGames.length >= 2 && shortGames.length >= 2) {
            const longWR = (longGames.filter(m => m.sets_won > m.sets_lost).length / longGames.length) * 100;
            const shortWR = (shortGames.filter(m => m.sets_won > m.sets_lost).length / shortGames.length) * 100;
            if (shortWR - longWR > 20) {
                flags.push({ id: 'STAMINA', label: 'Alerta de Stamina', desc: 'Sua taxa de vitória cai drasticamente em jogos longos.' });
            }
        }

        // 2. Lógica de Agressividade (Ritmo)
        if (metrics.avg_duration > 0) {
            const avgPointsPerMatch = matches.reduce((acc, m) => acc + (m.player_score + m.opponent_score), 0) / matches.length;
            const pointsPerMin = avgPointsPerMatch / metrics.avg_duration;
            if (pointsPerMin > 1.5) {
                flags.push({ id: 'AGRESSIVO', label: 'Estilo Agressivo', desc: 'Seu ritmo de jogo é intenso e foca em definições rápidas.' });
            }
        }

        // 3. Atribuição de Cenário Técnico
        if (metrics.win_rate >= 70) {
            scenario = metrics.avg_point_diff > 3 
                ? { id: 'T1', title: 'Desempenho Dominante', desc: 'Sua consistência se destaca de forma técnica e volumosa.' }
                : { id: 'T2', title: 'Decisivo Sob Pressão', desc: 'Você vence nos detalhes finais de forma cirúrgica.' };
        } else if (metrics.win_rate >= 40) {
            scenario = Math.abs(metrics.avg_point_diff) < 2
                ? { id: 'T4', title: 'Defesa Sólida', desc: 'Você atua como um paredão e cede poucos pontos gratuitos.' }
                : { id: 'T3', title: 'Oscilação Competitiva', desc: 'Alto potencial tático, mas lidando com inconsistência.' };
        } else {
            scenario = Math.abs(metrics.avg_point_diff) < 2
                ? { id: 'T5', title: 'Detalhes no Fechamento', desc: 'Falta um ajuste de margem técnica para fechar vitórias apertadas.' }
                : { id: 'T6', title: 'Desenvolvimento de Base', desc: 'Fase primária de ajuste técnico generalizado.' };
        }

        return { scenario, flags };
    }
}

module.exports = Aggregator;
