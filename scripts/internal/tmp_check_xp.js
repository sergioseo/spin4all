const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\sjwse\\OneDrive\\Documentos\\Antigravity\\spin4all\\backend\\.env' });

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT
});

async function checkXP() {
  try {
    const res = await pool.query('SELECT num_xp, flg_badge_diagnostico, flg_diagnostico_concluido FROM trusted.tb_membros_perfil WHERE id_usuario = 1');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
checkXP();
