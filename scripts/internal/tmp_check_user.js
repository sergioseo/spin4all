const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\sjwse\\OneDrive\\Documentos\\Antigravity\\spin4all\\backend\\.env' });

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT
});

async function checkUser() {
  try {
    const res = await pool.query('SELECT * FROM trusted.tb_membros_perfil WHERE id_usuario = 1');
    console.log(JSON.stringify(res.rows, null, 2));
    const history = await pool.query('SELECT * FROM trusted.tb_diagnostico_historico WHERE id_usuario = 1');
    console.log('HISTORY:', JSON.stringify(history.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkUser();
