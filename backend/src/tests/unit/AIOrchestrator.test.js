const test = require('node:test');
const assert = require('node:assert');
const AIOrchestrator = require('../../services/analysis/AIOrchestrator');

test('AIOrchestrator Service', async (t) => {
    await t.test('Deve gerar hash consistente para os mesmos dados', () => {
        const data1 = { a: 1, b: 2 };
        const data2 = { a: 1, b: 2 };
        const data3 = { a: 1, b: 3 };

        const hash1 = AIOrchestrator.generateHash(data1);
        const hash2 = AIOrchestrator.generateHash(data2);
        const hash3 = AIOrchestrator.generateHash(data3);

        assert.strictEqual(hash1, hash2);
        assert.notStrictEqual(hash1, hash3);
    });

    await t.test('Deve retornar resposta mockada se API Key estiver ausente', async () => {
        process.env.OPENAI_API_KEY = 'mock';
        const result = await AIOrchestrator.callLLM(
            { win_rate: 80, avg_point_diff: 5 },
            { id: 'T1', title: 'Dominante', desc: 'Desc' },
            []
        );
        assert.strictEqual(result.headline, 'Dominante');
        assert.ok(result.explicacao.includes('WR 80%'));
    });
});
