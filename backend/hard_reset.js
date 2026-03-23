const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function hardReset() {
  try {
    console.log('--- HARD RESET USUÁRIO 1 (SERGIO) ---');
    
    // 1. Zerar Perfil (XP, Flags, Skills base)
    await pool.query(`
      UPDATE trusted.tb_membros_perfil SET 
        num_xp = 0, 
        flg_diagnostico_concluido = false, 
        flg_badge_diagnostico = false,
        flg_perfil_concluido = true,
        num_skill_forehand = 50,
        num_skill_backhand = 50,
        num_skill_cozinhada = 50,
        num_skill_topspin = 50,
        num_skill_bloqueio = 50,
        num_skill_saque = 50,
        num_skill_rally = 50
      WHERE id_usuario = 1
    `);

    // 2. Limpar Missões
    await pool.query('DELETE FROM trusted.tb_missoes_usuario WHERE id_usuario = 1');

    // 3. Limpar Conquistas (Badges)
    await pool.query('DELETE FROM trusted.tb_usuarios_badges WHERE id_usuario = 1');

    console.log('>>> SUCESSO: XP=0, Missões=0, Badges=0. Usuário limpo.');
  } catch (err) {
    console.error('ERRO NO HARD RESET:', err);
  } finally {
    await pool.end();
  }
}

hardReset();
