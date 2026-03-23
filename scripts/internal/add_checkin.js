const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    const res = await pool.query("INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin) VALUES (1, '2026-03-16')");
    console.log(`Check-in inserido (rowCount: ${res.rowCount})`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
