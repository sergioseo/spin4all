const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'trusted' 
        AND table_name = 'tb_torneios_partidas';
    `);
    console.log('Colunas encontradas em trusted.tb_torneios_partidas:');
    res.rows.forEach(row => console.log(`- ${row.column_name}`));
    
    if (res.rows.length === 0) {
      console.log('TABELA NÃO ENCONTRADA!');
    }
  } catch (err) {
    console.error('Erro ao verificar colunas:', err);
  } finally {
    await pool.end();
  }
}

checkColumns();
