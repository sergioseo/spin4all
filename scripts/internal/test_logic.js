const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  const userId = 1;
  const matchesRes = await pool.query(`
    SELECT * FROM trusted.tb_analista_torneio_partidas WHERE id_usuario = $1
  `, [userId]);

  const allMatches = matchesRes.rows;
  
  const validMatches = allMatches.filter(m => {
    const totalSets = (m.sets_won || 0) + (m.sets_lost || 0);
    if (totalSets === 0) return false;
    if (m.sets_won > 3 || m.sets_lost > 3 || totalSets > 5) return false;
    
    if (m.dt_inicio && m.dt_fim) {
      const durationMin = (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000;
      if (durationMin < (1 * totalSets) || durationMin > (20 * totalSets)) {
        m.invalidTime = true;
      }
    }
    return true;
  });

  const longGames = validMatches.filter(m => !m.invalidTime && (new Date(m.dt_fim)-new Date(m.dt_inicio))/60000 > 25);
  const shortGames = validMatches.filter(m => !m.invalidTime && (new Date(m.dt_fim)-new Date(m.dt_inicio))/60000 <= 25);
  
  let flags = [];
  if (longGames.length >= 2 && shortGames.length >= 2) {
      const longWR = (longGames.filter(m => m.sets_won > m.sets_lost).length / longGames.length) * 100;
      const shortWR = (shortGames.filter(m => m.sets_won > m.sets_lost).length / shortGames.length) * 100;
      console.log('longWR:', longWR, 'shortWR:', shortWR);
      if (shortWR - longWR > 20) flags.push({ id: 'STAMINA', label: 'Alerta de Stamina', desc: 'Sua taxa de vitória cai significativamente em jogos longos.' });
  }

  const totalGames = validMatches.length;
  // Let's compute duration points
  let totalPointsDiff = 0;
  let gamesWithTime = 0;
  let totalDuration = 0;

  validMatches.forEach(m => {
      totalPointsDiff += (m.player_score || 0) - (m.opponent_score || 0);
      if (!m.invalidTime && m.dt_inicio && m.dt_fim) {
        gamesWithTime++;
        totalDuration += (new Date(m.dt_fim) - new Date(m.dt_inicio)) / 60000;
      }
    });
  const avg_duration = gamesWithTime > 0 ? Math.round(totalDuration / gamesWithTime) : null;

  if (avg_duration > 0) {
      const avgPointsPerMatch = validMatches.reduce((acc, m) => acc + (m.player_score + m.opponent_score), 0) / totalGames;
      const pointsPerMin = avgPointsPerMatch / avg_duration;
      console.log('ptsPerMin:', pointsPerMin);
      if (pointsPerMin > 1.5) flags.push({ id: 'AGRESSIVO', label: 'Estilo Agressivo', desc: 'Seu ritmo de jogo é intenso e foca em definições rápidas.' });
  }

  console.log('flags:', flags);

  await pool.end();
}

run();
