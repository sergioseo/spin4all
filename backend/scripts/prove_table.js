const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// [BOLT] Auditoria Silenciosa de Tabelas
async function auditDatabase() {
    const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const env = Object.fromEntries(
        envContent.split('\n')
            .filter(line => line.includes('='))
            .map(line => line.split('='))
    );

    const pool = new Pool({
        user: env.DB_USER.trim(),
        host: env.DB_HOST.trim(),
        database: env.DB_NAME.trim(),
        password: env.DB_PASSWORD.trim(),
        port: env.DB_PORT.trim(),
        ssl: { rejectUnauthorized: false } // Para conexões remotas se necessário
    });

    try {
        console.log('\n🔍 --- VARREDURA DE TABELAS (SCHEMA: trusted) ---');
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'trusted' 
            ORDER BY table_name;
        `);

        if (res.rows.length === 0) {
            console.log('❌ Nenhuma tabela encontrada no schema "trusted".');
        } else {
            res.rows.forEach(row => {
                const marker = row.table_name === 'tb_recuperacao_senha' ? '✅' : '🔹';
                console.log(`${marker} ${row.table_name}`);
            });
        }

        const exists = res.rows.some(r => r.table_name === 'tb_recuperacao_senha');
        console.log('\n🛡️ --- VEREDITO FINAL ---');
        if (exists) {
            console.log('✅ TABELA ENCONTRADA: trusted.tb_recuperacao_senha existe no catálogo.');
        } else {
            console.log('❌ ALERTA: A tabela realmente não existe no catálogo.');
        }

    } catch (err) {
        console.error('❌ Erro na auditoria:', err.message);
    } finally {
        await pool.end();
    }
}

auditDatabase();
