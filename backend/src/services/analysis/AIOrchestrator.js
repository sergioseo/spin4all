const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Stage 4: AIOrchestrator
 * Responsibility: Manage AI calls, prompts (Registry), and semantic caching via hashing.
 */
class AIOrchestrator {
    static generateHash(data) {
        const str = JSON.stringify(data);
        return crypto.createHash('md5').update(str).digest('hex');
    }

    static getSystemPrompt(metrics, scenario, flagStatus) {
        const promptPath = path.join(__dirname, '../../prompts/analysis_narrative.json');
        const promptData = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
        let promptTemplate = promptData.prompt;

        // Simple template replacement
        promptTemplate = promptTemplate
            .replace('{{win_rate}}', metrics.win_rate)
            .replace('{{avg_point_diff}}', metrics.avg_point_diff)
            .replace('{{flag_stamina}}', flagStatus.STAMINA)
            .replace('{{flag_agressive}}', flagStatus.AGRESSIVO);

        return promptTemplate;
    }

    static async callLLM(metrics, scenario, flags) {
        const apiKey = process.env.OPENAI_API_KEY;
        const flagStatus = {
            STAMINA: flags.some(f => f.id === 'STAMINA'),
            AGRESSIVO: flags.some(f => f.id === 'AGRESSIVO')
        };

        if (!apiKey || apiKey === 'mock') {
            return {
                headline: flagStatus.STAMINA ? "Queda de Intensidade" : (flagStatus.AGRESSIVO ? "Erro de Tomada de Decisão" : scenario.title),
                explicacao: `WR ${metrics.win_rate}%. ${scenario.desc}`,
                foco: flagStatus.STAMINA ? "Físico" : (flagStatus.AGRESSIVO ? "Tático" : "Técnico"),
                acao: flagStatus.STAMINA ? "Falkenberg" : (flagStatus.AGRESSIVO ? "3ª Bola" : "Precisão FH"),
                baseado_em: ["WR", "Diff"]
            };
        }

        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: this.getSystemPrompt(metrics, scenario, flagStatus) }],
                    temperature: 0.7,
                    max_tokens: 150,
                    response_format: { type: 'json_object' }
                })
            });
            
            if (!res.ok) throw new Error('Falha na OpenAI: ' + res.statusText);
            const data = await res.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (err) {
            console.error('[AI ORCHESTRATOR ERROR]:', err);
            throw err;
        }
    }
}

module.exports = AIOrchestrator;
