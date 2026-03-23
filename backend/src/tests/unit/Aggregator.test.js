const test = require('node:test');
const assert = require('node:assert');
const Aggregator = require('../../services/analysis/Aggregator');

test('Aggregator Service', async (t) => {
    await t.test('Deve detectar FLAG_STAMINA se vitórias caem em jogos longos', () => {
        const start = new Date('2024-03-22T10:00:00Z');
        const endShort = new Date('2024-03-22T10:10:00Z'); // 10 min
        const endLong = new Date('2024-03-22T10:35:00Z');  // 35 min

        const matches = [
            { sets_won: 3, sets_lost: 0, dt_inicio: start, dt_fim: endShort }, // Win Short
            { sets_won: 3, sets_lost: 0, dt_inicio: start, dt_fim: endShort }, // Win Short
            { sets_won: 0, sets_lost: 3, dt_inicio: start, dt_fim: endLong },  // Loss Long
            { sets_won: 0, sets_lost: 3, dt_inicio: start, dt_fim: endLong }   // Loss Long
        ];
        // Short WR: 100%, Long WR: 0% -> Diff: 100% (> 20%)

        const result = Aggregator.aggregate({ win_rate: 50 }, matches);
        const hasStamina = result.flags.some(f => f.id === 'STAMINA');
        assert.strictEqual(hasStamina, true);
    });

    await t.test('Deve detectar FLAG_AGRESSIVO se pts/min > 1.5', () => {
        const matches = [
            { player_score: 11, opponent_score: 9, sets_won: 1, sets_lost: 0 } 
        ];
        // Total Pts: 20. Duration: 10 min (simulado no Metrics)
        const metrics = { avg_duration: 10 }; 
        // 20 / 10 = 2 pts/min (> 1.5)

        const result = Aggregator.aggregate(metrics, matches);
        const hasAgressivo = result.flags.some(f => f.id === 'AGRESSIVO');
        assert.strictEqual(hasAgressivo, true);
    });

    await t.test('Deve atribuir cenário T1 para Dominância Técnica', () => {
        const metrics = { win_rate: 80, avg_point_diff: 5 };
        const result = Aggregator.aggregate(metrics, []);
        assert.strictEqual(result.scenario.id, 'T1');
    });

    await t.test('Deve atribuir cenário T6 para Iniciantes', () => {
        const metrics = { win_rate: 20, avg_point_diff: -5 };
        const result = Aggregator.aggregate(metrics, []);
        assert.strictEqual(result.scenario.id, 'T6');
    });
});
