const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seedAdmin() {
    const client = await pool.connect();
    try {
        console.log('--- 🚀 SIMULANDO FREQUÊNCIA PROGRESSIVA PARA SJWSEO ---');
        await client.query('DELETE FROM trusted.tb_checkins WHERE id_usuario = 1');
        
        const today = new Date();
        const checkins = [];
        const trainDays = [1, 3, 5]; // Mon, Wed, Fri

        for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
            const date = new Date();
            date.setDate(today.getDate() - dayOffset);
            
            if (trainDays.includes(date.getDay())) {
                let prob = 0.45; // Mês 1: < 60%
                if (dayOffset <= 60 && dayOffset > 30) prob = 0.70; // Mês 2: Evoluindo
                if (dayOffset <= 30) prob = 0.95; // Mês 3: Foco Total (~90%)

                if (Math.random() < prob) {
                    checkins.push([1, date.toISOString().split('T')[0]]);
                }
            }
        }

        for (const [uid, dt] of checkins) {
            await client.query('INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin) VALUES ($1, $2)', [uid, dt]);
        }

        console.log(`--- ✅ SUCESSO! ---`);
        console.log(`- ${checkins.length} check-ins gerados para o perfil 1.`);
        console.log(`- Calendário pronto para validar a progressão na Home.`);

    } catch (e) {
        console.error('Erro no seeding do admin:', e);
    } finally {
        client.release();
        process.exit();
    }
}

seedAdmin();
