const test = require('node:test');
const assert = require('node:assert');
const Cleaner = require('../../services/analysis/Cleaner');

test('Cleaner Service', async (t) => {
    await t.test('Deve filtrar partidas com total de sets = 0', () => {
        const matches = [{ sets_won: 0, sets_lost: 0 }];
        const result = Cleaner.sanitize(matches);
        assert.strictEqual(result.length, 0);
    });

    await t.test('Deve filtrar partidas com sets inválidos (MD5)', () => {
        const matches = [
            { sets_won: 4, sets_lost: 0 }, // Out of range (>3)
            { sets_won: 3, sets_lost: 3 }  // Out of range (total > 5)
        ];
        const result = Cleaner.sanitize(matches);
        assert.strictEqual(result.length, 0);
    });

    await t.test('Deve manter partidas válidas e marcar tempo inválido se necessário', () => {
        const start = new Date('2024-03-22T10:00:00Z');
        const endOk = new Date('2024-03-22T10:15:00Z'); // 15 min for 3 sets (Ok)
        const endTooFast = new Date('2024-03-22T10:00:10Z'); // 10 secs (Invalid Time)

        const matches = [
            { sets_won: 3, sets_lost: 0, dt_inicio: start, dt_fim: endOk },
            { sets_won: 3, sets_lost: 0, dt_inicio: start, dt_fim: endTooFast }
        ];

        const result = Cleaner.sanitize(matches);
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].invalidTime, undefined);
        assert.strictEqual(result[1].invalidTime, true);
    });
});
