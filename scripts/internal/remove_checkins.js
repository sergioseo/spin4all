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
    const res = await pool.query("DELETE FROM trusted.tb_checkins WHERE id_checkin IN (9247, 9246)");
    console.log(`Removidos ${res.rowCount} check-ins.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
