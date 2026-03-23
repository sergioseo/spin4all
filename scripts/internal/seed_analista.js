const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });
const DataIngestor = require('../../backend/src/services/data/ingestion/DataIngestor');

async function seedData() {
  const userId = 1; // Sergio
  try {
    console.log('--- SEEDING VIA DATA INGESTOR (RAW-FIRST) ---');
    
    // 1. Limpeza no Trusted (Opcional, mas para o teste ser limpo)
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    await pool.query('DELETE FROM trusted.tb_analista_torneio_partidas WHERE id_usuario = $1', [userId]);
    await pool.end();

    const matches = [
      { id_torneio: 201, payload: { id_oponente: 2, player_score: 11, opponent_score: 2, sets_won: 3, sets_lost: 0, dt_inicio: '2024-03-21 14:00:00', dt_fim: '2024-03-21 14:15:00' } },
      { id_torneio: 201, payload: { id_oponente: 3, player_score: 11, opponent_score: 4, sets_won: 3, sets_lost: 0, dt_inicio: '2024-03-21 14:30:00', dt_fim: '2024-03-21 14:45:00' } },
      { id_torneio: 201, payload: { id_oponente: 4, player_score: 11, opponent_score: 2, sets_won: 3, sets_lost: 0, dt_inicio: '2024-03-21 15:00:00', dt_fim: '2024-03-21 15:15:00' } },
      { id_torneio: 202, payload: { id_oponente: 5, player_score: 11, opponent_score: 9, sets_won: 3, sets_lost: 2, dt_inicio: '2024-03-21 16:00:00', dt_fim: '2024-03-21 17:10:00' } },
      { id_torneio: 202, payload: { id_oponente: 6, player_score: 8, opponent_score: 11, sets_won: 2, sets_lost: 3, dt_inicio: '2024-03-21 18:00:00', dt_fim: '2024-03-21 19:15:00' } },
      { id_torneio: 202, payload: { id_oponente: 7, player_score: 7, opponent_score: 11, sets_won: 2, sets_lost: 3, dt_inicio: '2024-03-21 20:00:00', dt_fim: '2024-03-21 21:20:00' } },
    ];

    for (const m of matches) {
      await DataIngestor.ingest('match', { 
        id_torneio: m.id_torneio, 
        payload: { ...m.payload, id_usuario: userId } 
      });
    }

    console.log('Seed via RAW concluído com sucesso!');
  } catch (err) {
    console.error('Erro no seed:', err);
  }
}

seedData();
