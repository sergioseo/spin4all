const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const ROCK_STARS = [
    { name: 'Kurt Cobain', email: 'kurt.cobain@rock90.com', birth: '1967-02-20', gender: 'M' },
    { name: 'Eddie Vedder', email: 'eddie.vedder@rock90.com', birth: '1964-12-23', gender: 'M' },
    { name: 'Dave Grohl', email: 'dave.grohl@rock90.com', birth: '1969-01-14', gender: 'M' },
    { name: 'Alanis Morissette', email: 'alanis.morissette@rock90.com', birth: '1974-06-01', gender: 'F' },
    { name: 'Dolores O\'Riordan', email: 'dolores.oriordan@rock90.com', birth: '1971-09-06', gender: 'F' },
    { name: 'Chris Cornell', email: 'chris.cornell@rock90.com', birth: '1964-07-20', gender: 'M' },
    { name: 'Billy Corgan', email: 'billy.corgan@rock90.com', birth: '1967-03-17', gender: 'M' },
    { name: 'Anthony Kiedis', email: 'anthony.kiedis@rock90.com', birth: '1962-11-01', gender: 'M' },
    { name: 'Gwen Stefani', email: 'gwen.stefani@rock90.com', birth: '1969-10-03', gender: 'F' },
    { name: 'Layne Staley', email: 'layne.staley@rock90.com', birth: '1967-08-22', gender: 'M' }
];

const HOLLYWOOD_STARS = [
    { name: 'Brad Pitt', email: 'brad.pitt@hollywood.com', birth: '1963-12-18', gender: 'M' },
    { name: 'Jennifer Aniston', email: 'jennifer.aniston@hollywood.com', birth: '1969-02-11', gender: 'F' },
    { name: 'Leonardo DiCaprio', email: 'leonardo.dicaprio@hollywood.com', birth: '1974-11-11', gender: 'M' },
    { name: 'Julia Roberts', email: 'julia.roberts@hollywood.com', birth: '1967-10-28', gender: 'F' },
    { name: 'Keanu Reeves', email: 'keanu.reeves@hollywood.com', birth: '1964-09-02', gender: 'M' },
    { name: 'Sandra Bullock', email: 'sandra.bullock@hollywood.com', birth: '1964-07-26', gender: 'F' },
    { name: 'Matt Damon', email: 'matt.damon@hollywood.com', birth: '1970-10-08', gender: 'M' },
    { name: 'Nicole Kidman', email: 'nicole.kidman@hollywood.com', birth: '1967-06-20', gender: 'F' },
    { name: 'Will Smith', email: 'will.smith@hollywood.com', birth: '1968-09-25', gender: 'M' },
    { name: 'Winona Ryder', email: 'winona.ryder@hollywood.com', birth: '1971-10-29', gender: 'F' },
    { name: 'Tom Cruise', email: 'tom.cruise@hollywood.com', birth: '1962-07-03', gender: 'M' },
    { name: 'Cameron Diaz', email: 'cameron.diaz@hollywood.com', birth: '1972-08-30', gender: 'F' },
    { name: 'Johnny Depp', email: 'johnny.depp@hollywood.com', birth: '1963-06-09', gender: 'M' },
    { name: 'Courteney Cox', email: 'courteney.cox@hollywood.com', birth: '1964-06-15', gender: 'F' },
    { name: 'Matthew Perry', email: 'matthew.perry@hollywood.com', birth: '1969-08-19', gender: 'M' },
    { name: 'Lisa Kudrow', email: 'lisa.kudrow@hollywood.com', birth: '1963-07-30', gender: 'F' },
    { name: 'Matt LeBlanc', email: 'matt.leblanc@hollywood.com', birth: '1967-07-25', gender: 'M' },
    { name: 'David Schwimmer', email: 'david.schwimmer@hollywood.com', birth: '1966-11-02', gender: 'M' },
    { name: 'Gwyneth Paltrow', email: 'gwyneth.paltrow@hollywood.com', birth: '1972-09-27', gender: 'F' },
    { name: 'Ben Affleck', email: 'ben.affleck@hollywood.com', birth: '1972-08-15', gender: 'M' }
];

const ALL_STARS = [...ROCK_STARS, ...HOLLYWOOD_STARS];

async function seed() {
    console.log('--- 🚀 INICIANDO SEEDING AUTOMATIZADO (V9) ---');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('1. 🔥 Limpando Tabelas (Preservando Admin)...');
        // Truncar tabelas que não afetam o admin radicalmente primeiro
        await client.query('TRUNCATE trusted.tb_checkins CASCADE');
        await client.query('TRUNCATE trusted.tb_membros_evolucao CASCADE');
        await client.query('TRUNCATE trusted.tb_usuarios_badges CASCADE');
        await client.query('TRUNCATE trusted.tb_torneios_resultados CASCADE');
        
        // Deletar usuários (exceto admin id=1) e seus perfis
        await client.query('DELETE FROM trusted.tb_membros_perfil WHERE id_usuario != 1');
        await client.query('DELETE FROM trusted.tb_usuarios WHERE id_usuario != 1');

        console.log('2. 🏗️ Criando Estrelas no Portal...');
        const passwordHash = await bcrypt.hash('rockstar2024', 10);
        
        for (let i = 0; i < ALL_STARS.length; i++) {
            const star = ALL_STARS[i];
            
            // Inserir Usuário
            const userRes = await client.query(
                'INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash, vlr_status_conta) VALUES ($1, $2, \'ativo\') RETURNING id_usuario',
                [star.email.toLowerCase(), passwordHash]
            );
            const userId = userRes.rows[0].id_usuario;
            star.userId = userId;

            // Definir Perfil e Distribuição
            const rand = Math.random();
            let level = 'Intermediário';
            let behavior = 'HighEngage'; // 50% High, 45% Churn, 5% Dropout
            
            if (i < ALL_STARS.length * 0.4) {
                level = 'Iniciante'; 
            } else if (i > ALL_STARS.length * 0.9) {
                level = 'Avançado';
            }

            if (rand < 0.05) behavior = 'Dropout';
            else if (rand < 0.50) behavior = 'ChurnRisk';

            star.behavior = behavior;
            star.level = level;

            // Inserir Perfil
            await client.query(`
                INSERT INTO trusted.tb_membros_perfil 
                (id_usuario, dsc_nome_completo, dt_nascimento, vlr_lateralidade, dsc_empunhadura, dsc_nivel_tecnico, num_telefone, dsc_foto_perfil)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                userId, 
                star.name, 
                star.birth, 
                Math.random() > 0.8 ? 'Canhoto' : 'Destro',
                ['Clássica', 'Caneta'][Math.floor(Math.random() * 2)],
                level,
                `(11) 9${Math.floor(Math.random() * 89999999 + 10000000)}`,
                `https://ui-avatars.com/api/?name=${encodeURIComponent(star.name)}&background=random&color=fff&size=256`
            ]);
        }

        console.log('3. 🕰️ Simulando 90 Dias de Timeline...');
        const today = new Date();
        const checkins = [];

        for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
            const date = new Date();
            date.setDate(today.getDate() - dayOffset);
            const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...
            
            // Apenas Seg (1), Qua (3), Sex (5)
            if ([1, 3, 5].includes(dayOfWeek)) {
                const dateStr = date.toISOString().split('T')[0];
                
                for (const star of ALL_STARS) {
                    let prob = 0.90; // HighEngage
                    if (star.behavior === 'ChurnRisk') prob = 0.50;
                    if (star.behavior === 'Dropout' && dayOffset < 83) prob = 0; // Para de ir após a 1ª semana

                    if (Math.random() < prob) {
                        checkins.push([star.userId, dateStr]);
                    }
                }
            }
        }

        // Batch insert check-ins
        for (const [uid, dt] of checkins) {
            await client.query('INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin) VALUES ($1, $2)', [uid, dt]);
        }

        console.log('4. 📈 Evoluindo Skills Técnicas...');
        for (const star of ALL_STARS) {
            let baseSkill = 40;
            if (star.level === 'Intermediário') baseSkill = 60;
            if (star.level === 'Avançado') baseSkill = 85;

            // Gerar 4 pontos de evolução ao longo dos 90 dias
            for (let e = 1; e <= 4; e++) {
                const eDate = new Date();
                eDate.setDate(today.getDate() - (100 - (e * 20)));
                
                // Evolução real para Iniciantes (40%)
                let skillVal = baseSkill + (Math.random() * 5);
                if (star.level === 'Iniciante') {
                    skillVal = baseSkill + (e * 6); // Sobe ~24 pontos em 90 dias
                }

                await client.query(`
                    INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total, dt_registro)
                    VALUES ($1, $2, $3)
                `, [star.userId, skillVal.toFixed(1), eDate.toISOString().split('T')[0]]);
            }
        }

        console.log('5. 🥇 Distribuindo Conquistas (Badges)...');
        // Badge 1 (Primeiro Treino) para quem tem algum check-in
        const activeUsers = [...new Set(checkins.map(c => c[0]))];
        for (const uid of activeUsers) {
            await client.query('INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge, dt_conquista) VALUES ($1, 1, CURRENT_DATE)', [uid]);
            
            const userCheckins = checkins.filter(c => c[0] === uid).length;
            if (userCheckins >= 15) {
                await client.query('INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge, dt_conquista) VALUES ($1, 5, CURRENT_DATE)', [uid]);
            }
            if (userCheckins >= 30) {
                await client.query('INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge, dt_conquista) VALUES ($1, 3, CURRENT_DATE)', [uid]);
            }
        }

        await client.query('COMMIT');
        console.log('--- ✅ SEEDING CONCLUÍDO COM SUCESSO! ---');
        console.log(`- ${ALL_STARS.length} Estrelas criadas.`);
        console.log(`- ${checkins.length} Check-ins gerados.`);
        console.log('- Todos os perfis populados com Rockstars e Hollywood stars.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ ERRO NO SEEDING:', e);
    } finally {
        client.release();
        process.exit();
    }
}

seed();
