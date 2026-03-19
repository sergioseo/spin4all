require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        console.log('--- TESTANDO FREQUENCIA (ID: 1) ---');
        const res = await pool.query('SELECT * FROM refined.vw_frequencia_mensal WHERE id_usuario = 1');
        console.log('RESULTADO:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('--- ERRO DETECTADO ---');
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
