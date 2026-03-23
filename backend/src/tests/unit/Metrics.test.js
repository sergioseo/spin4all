const test = require('node:test');
const assert = require('node:assert');
const Metrics = require('../../services/analysis/Metrics');

test('Metrics Service', async (t) => {
    await t.test('Deve retornar métricas zeradas se não houver partidas', () => {
        const result = Metrics.calculate([]);
        assert.strictEqual(result.games, 0);
        assert.strictEqual(result.win_rate, 0);
        assert.strictEqual(result.confidence, 'BAIXA');
    });

    await t.test('Deve calcular Win Rate e Point Diff corretamente', () => {
        const matches = [
            { id_torneio: 1, sets_won: 3, sets_lost: 0, player_score: 33, opponent_score: 10 }, // Win
            { id_torneio: 1, sets_won: 1, sets_lost: 3, player_score: 20, opponent_score: 44 }  // Loss
        ];
        const result = Metrics.calculate(matches);
        
        assert.strictEqual(result.games, 2);
        assert.strictEqual(result.wins, 1);
        assert.strictEqual(result.win_rate, 50);
        assert.strictEqual(result.avg_point_diff, -0.5); // (33-10 + 20-44) / 2 = (23 - 24) / 2 = -0.5
        assert.strictEqual(result.confidence, 'BAIXA');
    });

    await t.test('Deve atribuir Confiança ALTA para 6+ partidas', () => {
        const matches = Array(6).fill({ sets_won: 3, sets_lost: 0 });
        const result = Metrics.calculate(matches);
        assert.strictEqual(result.confidence, 'ALTA');
    });

    await t.test('Deve calcular duração apenas para tempos válidos', () => {
        const start = new Date('2024-03-22T10:00:00Z');
        const end = new Date('2024-03-22T10:10:00Z'); // 10 min
        
        const matches = [
            { sets_won: 3, sets_lost: 0, dt_inicio: start, dt_fim: end }, // 10 min
            { sets_won: 3, sets_lost: 0, invalidTime: true, dt_inicio: start, dt_fim: end } // Ignorado no tempo
        ];
        const result = Metrics.calculate(matches);
        assert.strictEqual(result.avg_duration, 10);
    });
});
