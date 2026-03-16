
const { Pool } = require('pg');
require('dotenv').config();

const hosts = ['localhost', process.env.DB_HOST, '127.0.0.1'];
let connected = false;

async function tryConnect(host) {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: host,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 2000
  });

  try {
    const res = await pool.query('SELECT 1');
    console.log(`Connected successfully to ${host}`);
    return pool;
  } catch (err) {
    console.log(`Failed to connect to ${host}: ${err.message}`);
    await pool.end();
    return null;
  }
}

async function start() {
  let activePool = null;
  for (const host of hosts) {
    if (!host) continue;
    activePool = await tryConnect(host);
    if (activePool) break;
  }

  if (!activePool) {
    console.log('CRITICAL: Could not connect to any database host.');
    return;
  }

  try {
    const email = 'sjwseo@gmail.com';
    const res = await activePool.query('SELECT id_usuario, dsc_email, vlr_status_conta, flg_admin FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    console.log('User result:', JSON.stringify(res.rows, null, 2));

    if (res.rows.length === 0) {
      console.log('USER NOT FOUND in table trusted.tb_usuarios');
      const all = await activePool.query('SELECT dsc_email FROM trusted.tb_usuarios LIMIT 5');
      console.log('Sample users:', all.rows.map(r => r.dsc_email).join(', '));
    }
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await activePool.end();
  }
}

start();
