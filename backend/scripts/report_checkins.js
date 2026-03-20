const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function report() {
    try {
        const totalRes = await pool.query('SELECT count(*) FROM trusted.tb_checkins');
        const userCountRes = await pool.query('SELECT count(distinct id_usuario) FROM trusted.tb_checkins');
        const topUsersRes = await pool.query(`
            SELECT p.dsc_nome_completo, count(c.id_checkin) as total
            FROM trusted.tb_checkins c
            JOIN trusted.tb_membros_perfil p ON c.id_usuario = p.id_usuario
            GROUP BY p.dsc_nome_completo
            ORDER BY total DESC
            LIMIT 10
        `);

        console.log('--- 📊 RELATÓRIO DE CHECK-INS SIMULADOS ---');
        console.log(`Total de Check-ins no Banco: ${totalRes.rows[0].count}`);
        console.log(`Total de Usuários Ativos (com check-in): ${userCountRes.rows[0].count}`);
        console.log('\n--- ⭐ TOP 10 FREQUÊNCIA (ESTRELAS) ---');
        topUsersRes.rows.forEach((r, i) => {
            console.log(`${i+1}. ${r.dsc_nome_completo}: ${r.total} presenças`);
        });

    } catch (e) {
        console.error('Erro no relatório:', e);
    } finally {
        process.exit();
    }
}

report();
