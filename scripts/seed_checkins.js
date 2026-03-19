const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Fetching members...');
    // We only seed check-ins for active members
    const membersRes = await client.query("SELECT id_usuario FROM trusted.tb_usuarios WHERE vlr_status_conta = 'ativo'");
    const memberIds = membersRes.rows.map(r => r.id_usuario);
    console.log(`Found ${memberIds.length} active members.`);

    if (memberIds.length === 0) {
      console.log('No members found. Please run the init seed first.');
      return;
    }

    console.log('Seeding check-ins for the last 60 days...');
    let count = 0;
    
    // We'll iterate backwards from today
    for (let i = 0; i < 60; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Table Tennis usually has specific training days: Mon, Wed, Fri
        // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        const dayOfWeek = date.getDay();
        const isTrainingDay = [1, 3, 5].includes(dayOfWeek);
        
        const dateStr = date.toISOString().split('T')[0];

        for (const id of memberIds) {
            // Higher probability on training days (70%), lower on others (10%)
            const probability = isTrainingDay ? 0.7 : 0.1;
            
            if (Math.random() < probability) {
                await client.query(
                    'INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [id, dateStr]
                );
                count++;
            }
        }
    }
    console.log(`Seeded ${count} check-ins for 60 days.`);
  } catch (err) {
    console.error('Error seeding check-ins:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
