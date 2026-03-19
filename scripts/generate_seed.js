const fs = require('fs');

const hash = '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty';
const bands = ['Nirvana', 'Pearl Jam', 'Alice in Chains', 'Soundgarden', 'Linkin Park', 'Foo Fighters', 'Green Day', 'RHCP', 'Radiohead', 'The Strokes'];
const levels = ['Iniciante', 'Intermediário', 'Avançado'];

let sql = '';

// Usuário Comum para Testes
sql += `-- Membro Comum de Teste (Senha: tester123)\n`;
sql += `INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash, flg_admin) VALUES (99, 'user@tester.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty', FALSE) ON CONFLICT DO NOTHING;\n`;
sql += `INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico) VALUES (99, 'Tester Member', 'Intermediário') ON CONFLICT DO NOTHING;\n\n`;

for(let i=100; i<300; i++){
    const band = bands[i % bands.length];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const age = 20 + Math.floor(Math.random() * 25);
    const weight = 60 + Math.floor(Math.random() * 35);
    const height = 160 + Math.floor(Math.random() * 30);
    
    sql += `INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (${i}, 'rockstar${i}@spin4all.com', '${hash}') ON CONFLICT DO NOTHING;\n`;
    sql += `INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (${i}, 'Star ${i} ${band}', '${level}', ${height}, ${weight}, 'https://i.pravatar.cc/150?u=${i}') ON CONFLICT DO NOTHING;\n`;
}

fs.writeFileSync('tmp_seed.sql', sql);
console.log('Seed SQL gerado com sucesso.');
