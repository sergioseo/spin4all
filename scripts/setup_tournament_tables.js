const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const sql = `
-- 1. Tabela Principal de Torneios
CREATE TABLE IF NOT EXISTS trusted.tb_torneios (
    id_torneio SERIAL PRIMARY KEY,
    dsc_nome VARCHAR(100) NOT NULL,
    dt_torneio DATE NOT NULL,
    vlr_status VARCHAR(20) DEFAULT 'inscricoes', -- inscricoes, sorteio, grupos, playoffs, finalizado
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inscrições (com validação de categoria calculada no momento do sorteio)
CREATE TABLE IF NOT EXISTS trusted.tb_torneios_inscritos (
    id_inscricao SERIAL PRIMARY KEY,
    id_torneio INTEGER REFERENCES trusted.tb_torneios(id_torneio) ON DELETE CASCADE,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    vlr_categoria VARCHAR(20), -- PRO, CHALLENGER, GP
    dt_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_torneio, id_usuario)
);

-- 3. Grupos da Fase Inicial
CREATE TABLE IF NOT EXISTS trusted.tb_torneios_grupos (
    id_grupo SERIAL PRIMARY KEY,
    id_torneio INTEGER REFERENCES trusted.tb_torneios(id_torneio) ON DELETE CASCADE,
    dsc_nome VARCHAR(10) NOT NULL, -- "Grupo A", "Grupo B"
    vlr_categoria VARCHAR(20) NOT NULL,
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Partidas (Fase de Grupos e Mata-Mata)
CREATE TABLE IF NOT EXISTS trusted.tb_torneios_partidas (
    id_partida SERIAL PRIMARY KEY,
    id_torneio INTEGER REFERENCES trusted.tb_torneios(id_torneio) ON DELETE CASCADE,
    id_grupo INTEGER REFERENCES trusted.tb_torneios_grupos(id_grupo) ON DELETE SET NULL,
    vlr_fase VARCHAR(50) DEFAULT 'grupo', -- grupo, oitavas, quartas, semi, final
    id_jogador1 INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE SET NULL,
    id_jogador2 INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE SET NULL,
    num_sets_jogador1 INTEGER DEFAULT 0,
    num_sets_jogador2 INTEGER DEFAULT 0,
    jsn_pontos_detalhado JSONB, -- Ex: [[11,9], [8,11], [11,5]]
    vlr_status VARCHAR(20) DEFAULT 'pendente', -- pendente, live, finalizado
    id_mesa INTEGER,
    dt_inicio TIMESTAMP,
    dt_fim TIMESTAMP,
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir um torneio de teste (Sextão de Março) se não houver
INSERT INTO trusted.tb_torneios (dsc_nome, dt_torneio, vlr_status)
VALUES ('Sextão de Março', '2026-03-27', 'inscricoes')
ON CONFLICT DO NOTHING;
`;

async function run() {
    try {
        console.log('--- Iniciando criação das tabelas de torneio ---');
        await pool.query(sql);
        console.log('✅ Tabelas criadas com sucesso!');
        
        // Seeding de inscritos (opcional, para teste)
        console.log('--- Fazendo bootstrap de inscritos para teste ---');
        const users = await pool.query('SELECT id_usuario FROM trusted.tb_usuarios LIMIT 48');
        for (const user of users.rows) {
            await pool.query('INSERT INTO trusted.tb_torneios_inscritos (id_torneio, id_usuario) VALUES (1, $1) ON CONFLICT DO NOTHING', [user.id_usuario]);
        }
        console.log(`✅ ${users.rowCount} usuários inscritos no torneio ID 1.`);
        
    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        await pool.end();
    }
}

run();
