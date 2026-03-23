const axios = require('axios');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

/**
 * SPIN4ALL - Test Runner 10.1
 * Responsável por validar a integridade da API e esquemas de dados.
 */

class TestRunner {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.ajv = new Ajv({ allErrors: true });
        this.schemaDir = path.join(__dirname, 'schemas');
    }

    /**
     * Carrega um esquema JSON do diretório de schemas
     */
    loadSchema(schemaName) {
        const filePath = path.join(this.schemaDir, `${schemaName}.schema.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`[TEST] Esquema ${schemaName} não encontrado.`);
            return null;
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    /**
     * Valida o health check básico da API
     */
    async checkHealth() {
        console.log(`[TEST] Validando Health Check em ${this.baseUrl}/api/health ...`);
        try {
            const res = await axios.get(`${this.baseUrl}/api/health`);
            
            // Validação de Status HTTP
            if (res.status !== 200) {
                return { success: false, reason: `Status HTTP inválido: ${res.status}` };
            }

            // Validação de Esquema (Opcional, se existir)
            const schema = this.loadSchema('health');
            if (schema) {
                const validate = this.ajv.compile(schema);
                const valid = validate(res.data);
                if (!valid) {
                    return { success: false, reason: 'Falha na validação de esquema AJV', errors: validate.errors };
                }
            }

            return { success: true };
        } catch (err) {
            return { success: false, reason: `Erro de conexão: ${err.message}` };
        }
    }

    /**
     * Executa a bateria de testes definida no manifesto
     */
    async runAll(requiredTests = []) {
        console.log('[TEST] Iniciando bateria de testes do Pipeline...');
        const results = [];

        // Por padrão, sempre roda health check
        results.push(await this.checkHealth());

        // Aqui poderiam entrar outros testes como Playwright ou endpoints específicos
        // ...

        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            return { 
                success: false, 
                reason: failed[0].reason, 
                details: failed[0].errors || null 
            };
        }

        console.log('[TEST] ✅ Todos os testes passaram!');
        return { success: true };
    }
}

module.exports = TestRunner;
