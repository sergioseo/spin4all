
const { Pool } = require('pg');
require('dotenv').config();

// Try localhost instead of the container name
const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUser() {
  try {
    const email = 'sjwseo@gmail.com';
    const res = await pool.query('SELECT id_usuario, dsc_email, vlr_status_conta, flg_admin FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    console.log('User check result:', JSON.stringify(res.rows, null, 2));
    
    if (res.rows.length === 0) {
      console.log('USER NOT FOUND');
      
      // Let's also check all users to see what's there
      const allRes = await pool.query('SELECT dsc_email FROM trusted.tb_usuarios LIMIT 10');
      console.log('Existing users (sample):', allRes.rows.map(r => r.dsc_email).join(', '));
    }
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
  }
}

checkUser();
