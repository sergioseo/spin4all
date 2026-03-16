
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUser() {
  try {
    const email = 'sjwseo@gmail.com';
    const res = await pool.query('SELECT id_usuario, dsc_email, vlr_status_conta, flg_admin FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    console.log('User check result:', JSON.stringify(res.rows, null, 2));
    
    if (res.rows.length === 0) {
      console.log('USER NOT FOUND');
    }
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
  }
}

checkUser();
