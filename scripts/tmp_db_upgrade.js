const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function upgrade() {
  let pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log('--- Testando conexão com principal ---');
    await pool.query('SELECT 1');
  } catch (err) {
    console.log('Host principal falhou, tentando localhost...');
    pool = new Pool({
      user: process.env.DB_USER,
      host: 'localhost',
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
  }

  try {
    console.log('--- Iniciando upgrade do banco ---');
    
    // Tabela de histórico de metas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trusted.tb_usuarios_metas_historico (
          id_historico SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dt_referencia DATE DEFAULT CURRENT_DATE,
          num_score_mobilidade INTEGER,
          UNIQUE(id_usuario, dt_referencia)
      );
    `);
    console.log('Tabela tb_usuarios_metas_historico verificada/criada.');

    // Coluna de foto de perfil
    await pool.query(`
      ALTER TABLE trusted.tb_membros_perfil 
      ADD COLUMN IF NOT EXISTS dsc_foto_perfil TEXT;
    `);
    console.log('Coluna dsc_foto_perfil verificada/criada.');

    console.log('--- Upgrade concluído com sucesso ---');
  } catch (err) {
    console.error('Erro no upgrade:', err);
  } finally {
    await pool.end();
  }
}

upgrade();
