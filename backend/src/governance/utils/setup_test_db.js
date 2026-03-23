const { Client } = require('pg');
require('dotenv').config();

/**
 * SPIN4ALL - Test Database Setup
 * Cria o banco de dados de teste de forma automatizada.
 */

async function setup() {
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'postgres' // Conecta ao default para criar o novo
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('[SETUP] Conectado ao PostgreSQL...');

        const dbName = 'db_portal_spin4all_test';
        
        // Verifica se existe
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        
        if (res.rowCount === 0) {
            console.log(`[SETUP] Criando banco de dados: ${dbName}...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`[SETUP] ✅ Banco ${dbName} criado com sucesso!`);
        } else {
            console.log(`[SETUP] Banco ${dbName} já existe.`);
        }

    } catch (err) {
        console.error('[SETUP] ❌ Erro ao configurar banco de teste:', err.message);
        console.log('[TIP] Verifique se as credenciais no .env estão corretas.');
    } finally {
        await client.end();
    }
}

setup();
