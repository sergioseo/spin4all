-- =========================================================
-- COMANDO DE RESET TOTAL (USE COM CUIDADO)
-- Este script apaga TUDO e reconstrÃ³i as 3 camadas do zero.
-- =========================================================
DROP SCHEMA IF EXISTS raw CASCADE;
DROP SCHEMA IF EXISTS trusted CASCADE;
DROP SCHEMA IF EXISTS refined CASCADE;

-- CRIAÃ‡ÃƒO DAS CAMADAS (SCHEMAS)
CREATE SCHEMA IF NOT EXISTS raw;     
CREATE SCHEMA IF NOT EXISTS trusted; 
CREATE SCHEMA IF NOT EXISTS refined; 

-----------------------------------------------------------
-- 1. CAMADA RAW (IngestÃ£o e Auditoria)
-----------------------------------------------------------

-- Tabela de IngestÃ£o do Onboarding (Caminho inicial)
CREATE TABLE IF NOT EXISTS raw.tb_onboarding_submissions (
    id_submissao SERIAL PRIMARY KEY,
    jsn_payload JSONB NOT NULL,
    vlr_status_processamento VARCHAR(20) DEFAULT 'pendente',
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Auditoria ObrigatÃ³ria (Para alteraÃ§Ãµes de perfil)
CREATE TABLE IF NOT EXISTS raw.tb_perfil_atualizacoes (
    id_atualizacao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    jsn_payload_antigo JSONB,
    jsn_payload_novo JSONB NOT NULL,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- 2. CAMADA TRUSTED (Single Source of Truth)
-----------------------------------------------------------

-- AutenticaÃ§Ã£o
CREATE TABLE IF NOT EXISTS trusted.tb_usuarios (
    id_usuario SERIAL PRIMARY KEY,
    dsc_email VARCHAR(255) UNIQUE NOT NULL,
    dsc_senha_hash VARCHAR(255) NOT NULL,
    vlr_status_conta VARCHAR(20) DEFAULT 'ativo',
    flg_admin BOOLEAN DEFAULT FALSE,
    num_logins INTEGER DEFAULT 0, -- Rastrear interaÃ§Ã£o
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_ultimo_login TIMESTAMP
);

-- Dados de Perfil Estruturados (Estado Atual)
CREATE TABLE IF NOT EXISTS trusted.tb_membros_perfil (
    id_perfil SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dsc_nome_completo VARCHAR(255) NOT NULL,
    dt_nascimento DATE,
    vlr_lateralidade VARCHAR(20), -- Destro, Canhoto
    dsc_empunhadura VARCHAR(50),
    dsc_nivel_tecnico VARCHAR(50),
    dsc_objetivo VARCHAR(100),
    dsc_metas TEXT,
    num_altura_cm INTEGER,
    num_peso_kg INTEGER,
    num_telefone VARCHAR(20),
    dsc_foto_perfil TEXT,
    num_skill_forehand INTEGER DEFAULT 50,
    num_skill_backhand INTEGER DEFAULT 50,
    num_skill_saque INTEGER DEFAULT 50,
    num_skill_cozinhada INTEGER DEFAULT 50,
    num_skill_topspin INTEGER DEFAULT 50,
    num_skill_rally INTEGER DEFAULT 50,
    num_skill_ataque INTEGER DEFAULT 50,
    num_skill_defesa INTEGER DEFAULT 50,
    num_skill_bloqueio INTEGER DEFAULT 50,
    num_skill_controle INTEGER DEFAULT 50,
    num_skill_movimentacao INTEGER DEFAULT 50,
    dsc_mensagem_mentor TEXT, -- Campo para recado ao mentor
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Check-ins (PresenÃ§a Presencial)
CREATE TABLE IF NOT EXISTS trusted.tb_checkins (
    id_checkin SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dt_checkin DATE DEFAULT CURRENT_DATE,
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, dt_checkin)
);

-- Tabela de Resultados de Torneios
CREATE TABLE IF NOT EXISTS trusted.tb_torneios_resultados (
    id_resultado SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dt_torneio DATE DEFAULT CURRENT_DATE,
    num_posicao INTEGER,
    dsc_torneio_nome VARCHAR(100) DEFAULT 'Torneio Interno',
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de HistÃ³rico de Mobilidade
CREATE TABLE IF NOT EXISTS trusted.tb_usuarios_metas_historico (
    id_historico SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dt_referencia DATE DEFAULT CURRENT_DATE,
    num_score_mobilidade INTEGER,
    UNIQUE(id_usuario, dt_referencia)
);

-- Tabela de EvoluÃ§Ã£o de Habilidades (Para Ranking de EvoluÃ§Ã£o)
CREATE TABLE IF NOT EXISTS trusted.tb_membros_evolucao (
    id_evolucao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dt_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    num_skill_avg_total NUMERIC(5,2), -- MÃ©dia de todas as skills no momento
    num_skill_forehand INTEGER,
    num_skill_backhand INTEGER,
    num_skill_saque INTEGER,
    num_skill_recepcao INTEGER,
    num_skill_movimentacao INTEGER,
    num_skill_bloqueio INTEGER,
    num_skill_controle INTEGER
);

-- DefiniÃ§Ã£o de Badges
CREATE TABLE IF NOT EXISTS trusted.tb_badges_definicao (
    id_badge SERIAL PRIMARY KEY,
    dsc_nome VARCHAR(100) NOT NULL,
    dsc_descricao TEXT,
    dsc_icone VARCHAR(50), -- Class do FontAwesome
    vlr_tipo VARCHAR(50), -- 'checkin_streak', 'total_checkins', 'skill_level', etc.
    num_requisito INTEGER
);

-- Badges dos UsuÃ¡rios
CREATE TABLE IF NOT EXISTS trusted.tb_usuarios_badges (
    id_usuario_badge SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    id_badge INTEGER REFERENCES trusted.tb_badges_definicao(id_badge) ON DELETE CASCADE,
    dt_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_badge)
);

-----------------------------------------------------------
-- 3. CAMADA REFINED (Consumo/Dashboards)
-----------------------------------------------------------

-- VIEW: Hall da Fama (Ranking por Pontos de Torneio - Ãšltimos 12 Meses)
CREATE OR REPLACE VIEW refined.vw_hall_fama AS
WITH pontos_calc AS (
    SELECT 
        id_usuario,
        SUM(CASE 
            WHEN num_posicao = 1 THEN 5
            WHEN num_posicao = 2 THEN 3
            WHEN num_posicao = 3 THEN 2
            ELSE 1 
        END) as total_pontos
    FROM trusted.tb_torneios_resultados
    WHERE dt_torneio >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY id_usuario
),
checkins_calc AS (
    SELECT id_usuario, COUNT(*) as num_presencas
    FROM trusted.tb_checkins
    GROUP BY id_usuario
)
SELECT 
    p.id_usuario,
    mp.dsc_nome_completo,
    mp.dsc_foto_perfil,
    p.total_pontos,
    COALESCE(c.num_presencas, 0) as num_presencas,
    u.num_logins
FROM pontos_calc p
JOIN trusted.tb_membros_perfil mp ON p.id_usuario = mp.id_usuario
JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario
LEFT JOIN checkins_calc c ON p.id_usuario = c.id_usuario
ORDER BY p.total_pontos DESC, num_presencas DESC, u.num_logins DESC, mp.dsc_nome_completo ASC;

-- VIEW: Ranking de EvoluÃ§Ã£o Mensal
CREATE OR REPLACE VIEW refined.vw_ranking_evolucao AS
WITH baseline AS (
    SELECT DISTINCT ON (id_usuario) 
        id_usuario, num_skill_avg_total as val_inicio
    FROM trusted.tb_membros_evolucao
    WHERE dt_registro >= DATE_TRUNC('month', CURRENT_DATE)
    ORDER BY id_usuario, dt_registro ASC
),
current_val AS (
    SELECT id_usuario, 
    ((num_skill_forehand + num_skill_backhand + num_skill_saque + num_skill_cozinhada + 
      num_skill_topspin + num_skill_rally + num_skill_ataque + num_skill_defesa + 
      num_skill_bloqueio + num_skill_controle + num_skill_movimentacao)/11.0) as val_atual
    FROM trusted.tb_membros_perfil
)
SELECT 
    cv.id_usuario,
    mp.dsc_nome_completo,
    mp.dsc_foto_perfil,
    (cv.val_atual - b.val_inicio) as num_evolucao,
    u.num_logins
FROM current_val cv
JOIN baseline b ON cv.id_usuario = b.id_usuario
JOIN trusted.tb_membros_perfil mp ON cv.id_usuario = mp.id_usuario
JOIN trusted.tb_usuarios u ON cv.id_usuario = u.id_usuario
WHERE (cv.val_atual - b.val_inicio) > 0
ORDER BY num_evolucao DESC, u.num_logins DESC, mp.dsc_nome_completo ASC;

-- VIEW: SegmentaÃ§Ã£o de NÃ­vel TÃ©cnico
CREATE OR REPLACE VIEW refined.vw_segmentacao_nivel AS
SELECT 
    dsc_nivel_tecnico,
    COUNT(*) as num_membros
FROM trusted.tb_membros_perfil
GROUP BY dsc_nivel_tecnico;

-- VIEW: Analytics DemogrÃ¡fico
CREATE OR REPLACE VIEW refined.vw_analytics_demografico AS
SELECT 
    p.dsc_nivel_tecnico,
    EXTRACT(YEAR FROM AGE(p.dt_nascimento)) as num_idade,
    COUNT(*) as num_membros
FROM trusted.tb_membros_perfil p
GROUP BY p.dsc_nivel_tecnico, num_idade;

-- VIEW: EstatÃ­sticas de Check-ins (Últimos 14 dias)
CREATE OR REPLACE VIEW refined.vw_checkins_stats AS
SELECT 
    d.day as dt_checkin,
    COALESCE(COUNT(c.id_checkin), 0) as num_checkins
FROM (
    SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day')::date as day
) d
LEFT JOIN trusted.tb_checkins c ON d.day = c.dt_checkin
GROUP BY d.day
ORDER BY d.day ASC;

-- VIEW: FrequÃªncia Mensal Consolidada
CREATE OR REPLACE VIEW refined.vw_frequencia_mensal AS
SELECT 
    u.id_usuario,
    COUNT(c.id_checkin) as num_presencas,
    ROUND((COUNT(c.id_checkin)::float / 12.0) * 100) as pct_frequencia, -- Base 12 treinos/mês
    CASE 
        WHEN COUNT(c.id_checkin) >= 8 THEN 'Apto ✅'
        ELSE 'Pendente ❌'
    END as dsc_status_torneio
FROM trusted.tb_usuarios u
LEFT JOIN trusted.tb_checkins c ON u.id_usuario = c.id_usuario 
    AND c.dt_checkin >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.id_usuario;

-----------------------------------------------------------
-- 5. DEFINIÃ‡ÃƒO DE BADGES (CONQUISTAS)
-----------------------------------------------------------
INSERT INTO trusted.tb_badges_definicao (dsc_nome, dsc_descricao, dsc_icone, vlr_tipo, num_requisito) VALUES
('Primeiro Passo', 'Realizou seu primeiro check-in!', 'fas fa-shoe-prints', 'total_checkins', 1),
('Ritmo Inicial', 'Completou 3 check-ins.', 'fas fa-fire-alt', 'total_checkins', 3),
('FrequÃªncia 5', 'Completou 5 check-ins.', 'fas fa-bolt', 'total_checkins', 5),
('HÃ¡bito Formado', 'Completou 7 check-ins.', 'fas fa-calendar-check', 'total_checkins', 7),
('Top 10', 'Chegou a 10 check-ins!', 'fas fa-star', 'total_checkins', 10),
('Bronze Streak', 'Chegou a 20 check-ins.', 'fas fa-medal', 'total_checkins', 20),
('Silver Streak', 'Chegou a 40 check-ins.', 'fas fa-award', 'total_checkins', 40),
('Gold Streak', 'Chegou a 60 check-ins.', 'fas fa-trophy', 'total_checkins', 60),
('Platinum Club', 'Chegou a 80 check-ins.', 'fas fa-gem', 'total_checkins', 80),
('Lenda do Clube', 'AlcanÃ§ou 100 check-ins!', 'fas fa-crown', 'total_checkins', 100),
('Interativo Supremo', 'Entrou no portal 50 vezes.', 'fas fa-mouse-pointer', 'behavior', 50),
('Parede Humana', 'Bloqueio superior a 80.', 'fas fa-shield-alt', 'skill', 80),
('CanhÃ£o de Forehand', 'Forehand superior a 80.', 'fas fa-fire', 'skill', 80),
('Maestro do Backhand', 'Backhand superior a 80.', 'fas fa-magic', 'skill', 80),
('Estrategista', 'Controle superior a 80.', 'fas fa-chess', 'skill', 80),
('Agilidade Pura', 'Movimentacao superior a 80.', 'fas fa-running', 'skill', 80),
('Em AscensÃ£o', 'EvoluÃ§Ã£o mensal superior a 5 pontos.', 'fas fa-level-up-alt', 'evolution', 5),
('Comprometido 100%', '100% de frequÃªncia em 1 mÃªs.', 'fas fa-calendar-check', 'behavior', 1),
('Veterano', '6 meses de clube.', 'fas fa-user-clock', 'tenure', 6),
('SÃ³cio Fundador', '1 ano de clube.', 'fas fa-history', 'tenure', 12),
('Podium Regular', '3 vezes no Top 3 do Hall da Fama.', 'fas fa-medal', 'competition', 3),
('Mestre do Topspin', 'Topspin superior a 80.', 'fas fa-vortex', 'skill', 80),
('Defesa de Ferro', 'Defesa superior a 80.', 'fas fa-dungeon', 'skill', 80),
('Guerreiro do Rally', 'Rally superior a 80.', 'fas fa-exchange-alt', 'skill', 80),
('Dedicado', 'Atualizou skills 4 vezes num mÃªs.', 'fas fa-sync-alt', 'behavior', 4),
('Equilibrado', 'Todas as habilidades acima de 50.', 'fas fa-balance-scale', 'skill', 50),
('Doutor em TÃªnis de Mesa', 'MÃ©dia geral superior a 80.', 'fas fa-graduation-cap', 'skill', 80),
('Competidor Nato', 'Participou de 5 torneios oficiais.', 'fas fa-table-tennis', 'event', 5),
('Perfil Completo', 'Preencheu todos os dados do portal.', 'fas fa-user-check', 'profile', 100)
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- 6. ADMIN & TESTER BOOTSTRAP
-----------------------------------------------------------

-- 1. Master Admin
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash, flg_admin) 
VALUES (1, 'sjwseo@gmail.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty', TRUE)
ON CONFLICT (dsc_email) DO UPDATE SET flg_admin = TRUE;

INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico)
VALUES (1, 'Sergio SEO', 'AvanÃ§ado')
ON CONFLICT DO NOTHING;

-- 2. Membro de Teste Comum (Senha: admin123)
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash, flg_admin, num_logins) 
VALUES (99, 'user@tester.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty', FALSE, 15)
ON CONFLICT (dsc_email) DO UPDATE SET flg_admin = FALSE;

INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_skill_saque)
VALUES (99, 'Tester Member', 'IntermediÃ¡rio', 92)
ON CONFLICT DO NOTHING;

-- Baseline de EvoluÃ§Ã£o para o Tester
INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total, dt_registro)
VALUES (99, 45.0, CURRENT_DATE - INTERVAL '1 month')
ON CONFLICT DO NOTHING;

-- Badges Iniciais para o Tester
INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge) VALUES
(99, 1), (99, 2), (99, 13) -- Primeiro Passo, Ritmo Inicial, Mestre do Saque
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- 6. SEEDING DE DADOS (200 ROCKSTARS)
-----------------------------------------------------------
-- Rockstar list starts from 100 (1 and 99 are seeded above)
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (100, 'rockstar100@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (100, 'Star 100 Nirvana', 'IntermediÃ¡rio', 187, 63, 'https://i.pravatar.cc/150?u=100') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (101, 'rockstar101@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (101, 'Star 101 Pearl Jam', 'AvanÃ§ado', 189, 66, 'https://i.pravatar.cc/150?u=101') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (102, 'rockstar102@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (102, 'Star 102 Alice in Chains', 'AvanÃ§ado', 168, 87, 'https://i.pravatar.cc/150?u=102') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (103, 'rockstar103@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (103, 'Star 103 Soundgarden', 'IntermediÃ¡rio', 161, 64, 'https://i.pravatar.cc/150?u=103') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (104, 'rockstar104@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (104, 'Star 104 Linkin Park', 'IntermediÃ¡rio', 174, 72, 'https://i.pravatar.cc/150?u=104') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (105, 'rockstar105@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (105, 'Star 105 Foo Fighters', 'AvanÃ§ado', 160, 63, 'https://i.pravatar.cc/150?u=105') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (106, 'rockstar106@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (106, 'Star 106 Green Day', 'IntermediÃ¡rio', 179, 88, 'https://i.pravatar.cc/150?u=106') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (107, 'rockstar107@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (107, 'Star 107 RHCP', 'Iniciante', 166, 70, 'https://i.pravatar.cc/150?u=107') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (108, 'rockstar108@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (108, 'Star 108 Radiohead', 'Iniciante', 164, 90, 'https://i.pravatar.cc/150?u=108') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (109, 'rockstar109@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (109, 'Star 109 The Strokes', 'IntermediÃ¡rio', 177, 92, 'https://i.pravatar.cc/150?u=109') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (110, 'rockstar110@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (110, 'Star 110 Nirvana', 'Iniciante', 174, 94, 'https://i.pravatar.cc/150?u=110') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (111, 'rockstar111@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (111, 'Star 111 Pearl Jam', 'AvanÃ§ado', 170, 83, 'https://i.pravatar.cc/150?u=111') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (112, 'rockstar112@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (112, 'Star 112 Alice in Chains', 'AvanÃ§ado', 173, 93, 'https://i.pravatar.cc/150?u=112') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (113, 'rockstar113@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (113, 'Star 113 Soundgarden', 'Iniciante', 170, 82, 'https://i.pravatar.cc/150?u=113') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (114, 'rockstar114@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (114, 'Star 114 Linkin Park', 'Iniciante', 176, 88, 'https://i.pravatar.cc/150?u=114') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (115, 'rockstar115@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (115, 'Star 115 Foo Fighters', 'AvanÃ§ado', 171, 73, 'https://i.pravatar.cc/150?u=115') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (116, 'rockstar116@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (116, 'Star 116 Green Day', 'AvanÃ§ado', 172, 82, 'https://i.pravatar.cc/150?u=116') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (117, 'rockstar117@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (117, 'Star 117 RHCP', 'IntermediÃ¡rio', 178, 75, 'https://i.pravatar.cc/150?u=117') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (118, 'rockstar118@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (118, 'Star 118 Radiohead', 'IntermediÃ¡rio', 167, 66, 'https://i.pravatar.cc/150?u=118') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (119, 'rockstar119@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (119, 'Star 119 The Strokes', 'AvanÃ§ado', 174, 62, 'https://i.pravatar.cc/150?u=119') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (120, 'rockstar120@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (120, 'Star 120 Nirvana', 'Iniciante', 176, 71, 'https://i.pravatar.cc/150?u=120') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (121, 'rockstar121@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (121, 'Star 121 Pearl Jam', 'IntermediÃ¡rio', 185, 92, 'https://i.pravatar.cc/150?u=121') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (122, 'rockstar122@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (122, 'Star 122 Alice in Chains', 'AvanÃ§ado', 173, 84, 'https://i.pravatar.cc/150?u=122') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (123, 'rockstar123@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (123, 'Star 123 Soundgarden', 'Iniciante', 178, 85, 'https://i.pravatar.cc/150?u=123') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (124, 'rockstar124@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (124, 'Star 124 Linkin Park', 'Iniciante', 170, 68, 'https://i.pravatar.cc/150?u=124') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (125, 'rockstar125@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (125, 'Star 125 Foo Fighters', 'IntermediÃ¡rio', 181, 67, 'https://i.pravatar.cc/150?u=125') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (126, 'rockstar126@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (126, 'Star 126 Green Day', 'AvanÃ§ado', 170, 62, 'https://i.pravatar.cc/150?u=126') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (127, 'rockstar127@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (127, 'Star 127 RHCP', 'Iniciante', 181, 86, 'https://i.pravatar.cc/150?u=127') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (128, 'rockstar128@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (128, 'Star 128 Radiohead', 'IntermediÃ¡rio', 176, 65, 'https://i.pravatar.cc/150?u=128') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (129, 'rockstar129@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (129, 'Star 129 The Strokes', 'AvanÃ§ado', 183, 78, 'https://i.pravatar.cc/150?u=129') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (130, 'rockstar130@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (130, 'Star 130 Nirvana', 'IntermediÃ¡rio', 178, 92, 'https://i.pravatar.cc/150?u=130') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (131, 'rockstar131@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (131, 'Star 131 Pearl Jam', 'IntermediÃ¡rio', 173, 94, 'https://i.pravatar.cc/150?u=131') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (132, 'rockstar132@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (132, 'Star 132 Alice in Chains', 'Iniciante', 170, 78, 'https://i.pravatar.cc/150?u=132') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (133, 'rockstar133@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (133, 'Star 133 Soundgarden', 'IntermediÃ¡rio', 185, 85, 'https://i.pravatar.cc/150?u=133') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (134, 'rockstar134@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (134, 'Star 134 Linkin Park', 'IntermediÃ¡rio', 165, 71, 'https://i.pravatar.cc/150?u=134') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (135, 'rockstar135@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (135, 'Star 135 Foo Fighters', 'AvanÃ§ado', 179, 71, 'https://i.pravatar.cc/150?u=135') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (136, 'rockstar136@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (136, 'Star 136 Green Day', 'Iniciante', 172, 93, 'https://i.pravatar.cc/150?u=136') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (137, 'rockstar137@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (137, 'Star 137 RHCP', 'IntermediÃ¡rio', 177, 82, 'https://i.pravatar.cc/150?u=137') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (138, 'rockstar138@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (138, 'Star 138 Radiohead', 'IntermediÃ¡rio', 178, 68, 'https://i.pravatar.cc/150?u=138') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (139, 'rockstar139@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (139, 'Star 139 The Strokes', 'Iniciante', 168, 65, 'https://i.pravatar.cc/150?u=139') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (140, 'rockstar140@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (140, 'Star 140 Nirvana', 'AvanÃ§ado', 182, 82, 'https://i.pravatar.cc/150?u=140') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (141, 'rockstar141@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (141, 'Star 141 Pearl Jam', 'AvanÃ§ado', 170, 62, 'https://i.pravatar.cc/150?u=141') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (142, 'rockstar142@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (142, 'Star 142 Alice in Chains', 'IntermediÃ¡rio', 171, 85, 'https://i.pravatar.cc/150?u=142') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (143, 'rockstar143@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (143, 'Star 143 Soundgarden', 'IntermediÃ¡rio', 184, 77, 'https://i.pravatar.cc/150?u=143') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (144, 'rockstar144@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (144, 'Star 144 Linkin Park', 'AvanÃ§ado', 174, 93, 'https://i.pravatar.cc/150?u=144') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (145, 'rockstar145@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (145, 'Star 145 Foo Fighters', 'AvanÃ§ado', 171, 76, 'https://i.pravatar.cc/150?u=145') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (146, 'rockstar146@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (146, 'Star 146 Green Day', 'AvanÃ§ado', 166, 74, 'https://i.pravatar.cc/150?u=146') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (147, 'rockstar147@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (147, 'Star 147 RHCP', 'IntermediÃ¡rio', 177, 69, 'https://i.pravatar.cc/150?u=147') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (148, 'rockstar148@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (148, 'Star 148 Radiohead', 'AvanÃ§ado', 167, 65, 'https://i.pravatar.cc/150?u=148') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (149, 'rockstar149@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (149, 'Star 149 The Strokes', 'AvanÃ§ado', 162, 89, 'https://i.pravatar.cc/150?u=149') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (150, 'rockstar150@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (150, 'Star 150 Nirvana', 'AvanÃ§ado', 188, 69, 'https://i.pravatar.cc/150?u=150') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (151, 'rockstar151@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (151, 'Star 151 Pearl Jam', 'AvanÃ§ado', 180, 66, 'https://i.pravatar.cc/150?u=151') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (152, 'rockstar152@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (152, 'Star 152 Alice in Chains', 'IntermediÃ¡rio', 178, 63, 'https://i.pravatar.cc/150?u=152') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (153, 'rockstar153@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (153, 'Star 153 Soundgarden', 'AvanÃ§ado', 169, 79, 'https://i.pravatar.cc/150?u=153') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (154, 'rockstar154@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (154, 'Star 154 Linkin Park', 'Iniciante', 162, 65, 'https://i.pravatar.cc/150?u=154') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (155, 'rockstar155@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (155, 'Star 155 Foo Fighters', 'Iniciante', 181, 89, 'https://i.pravatar.cc/150?u=155') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (156, 'rockstar156@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (156, 'Star 156 Green Day', 'AvanÃ§ado', 185, 92, 'https://i.pravatar.cc/150?u=156') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (157, 'rockstar157@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (157, 'Star 157 RHCP', 'IntermediÃ¡rio', 173, 86, 'https://i.pravatar.cc/150?u=157') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (158, 'rockstar158@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (158, 'Star 158 Radiohead', 'Iniciante', 174, 87, 'https://i.pravatar.cc/150?u=158') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (159, 'rockstar159@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (159, 'Star 159 The Strokes', 'Iniciante', 165, 70, 'https://i.pravatar.cc/150?u=159') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (160, 'rockstar160@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (160, 'Star 160 Nirvana', 'Iniciante', 179, 67, 'https://i.pravatar.cc/150?u=160') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (161, 'rockstar161@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (161, 'Star 161 Pearl Jam', 'Iniciante', 160, 90, 'https://i.pravatar.cc/150?u=161') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (162, 'rockstar162@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (162, 'Star 162 Alice in Chains', 'Iniciante', 188, 81, 'https://i.pravatar.cc/150?u=162') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (163, 'rockstar163@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (163, 'Star 163 Soundgarden', 'Iniciante', 186, 75, 'https://i.pravatar.cc/150?u=163') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (164, 'rockstar164@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (164, 'Star 164 Linkin Park', 'Iniciante', 165, 84, 'https://i.pravatar.cc/150?u=164') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (165, 'rockstar165@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (165, 'Star 165 Foo Fighters', 'IntermediÃ¡rio', 164, 70, 'https://i.pravatar.cc/150?u=165') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (166, 'rockstar166@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (166, 'Star 166 Green Day', 'AvanÃ§ado', 169, 83, 'https://i.pravatar.cc/150?u=166') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (167, 'rockstar167@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (167, 'Star 167 RHCP', 'IntermediÃ¡rio', 187, 76, 'https://i.pravatar.cc/150?u=167') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (168, 'rockstar168@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (168, 'Star 168 Radiohead', 'AvanÃ§ado', 178, 67, 'https://i.pravatar.cc/150?u=168') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (169, 'rockstar169@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (169, 'Star 169 The Strokes', 'Iniciante', 179, 76, 'https://i.pravatar.cc/150?u=169') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (170, 'rockstar170@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (170, 'Star 170 Nirvana', 'IntermediÃ¡rio', 188, 72, 'https://i.pravatar.cc/150?u=170') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (171, 'rockstar171@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (171, 'Star 171 Pearl Jam', 'Iniciante', 183, 65, 'https://i.pravatar.cc/150?u=171') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (172, 'rockstar172@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (172, 'Star 172 Alice in Chains', 'Iniciante', 171, 72, 'https://i.pravatar.cc/150?u=172') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (173, 'rockstar173@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (173, 'Star 173 Soundgarden', 'Iniciante', 165, 89, 'https://i.pravatar.cc/150?u=173') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (174, 'rockstar174@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (174, 'Star 174 Linkin Park', 'Iniciante', 177, 79, 'https://i.pravatar.cc/150?u=174') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (175, 'rockstar175@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (175, 'Star 175 Foo Fighters', 'AvanÃ§ado', 188, 72, 'https://i.pravatar.cc/150?u=175') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (176, 'rockstar176@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (176, 'Star 176 Green Day', 'IntermediÃ¡rio', 183, 91, 'https://i.pravatar.cc/150?u=176') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (177, 'rockstar177@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (177, 'Star 177 RHCP', 'AvanÃ§ado', 173, 93, 'https://i.pravatar.cc/150?u=177') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (178, 'rockstar178@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (178, 'Star 178 Radiohead', 'Iniciante', 166, 65, 'https://i.pravatar.cc/150?u=178') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (179, 'rockstar179@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (179, 'Star 179 The Strokes', 'IntermediÃ¡rio', 177, 61, 'https://i.pravatar.cc/150?u=179') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (180, 'rockstar180@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (180, 'Star 180 Nirvana', 'IntermediÃ¡rio', 176, 69, 'https://i.pravatar.cc/150?u=180') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (181, 'rockstar181@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (181, 'Star 181 Pearl Jam', 'Iniciante', 175, 91, 'https://i.pravatar.cc/150?u=181') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (182, 'rockstar182@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (182, 'Star 182 Alice in Chains', 'AvanÃ§ado', 181, 60, 'https://i.pravatar.cc/150?u=182') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (183, 'rockstar183@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (183, 'Star 183 Soundgarden', 'IntermediÃ¡rio', 164, 94, 'https://i.pravatar.cc/150?u=183') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (184, 'rockstar184@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (184, 'Star 184 Linkin Park', 'IntermediÃ¡rio', 163, 75, 'https://i.pravatar.cc/150?u=184') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (185, 'rockstar185@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (185, 'Star 185 Foo Fighters', 'Iniciante', 167, 92, 'https://i.pravatar.cc/150?u=185') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (186, 'rockstar186@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (186, 'Star 186 Green Day', 'AvanÃ§ado', 189, 78, 'https://i.pravatar.cc/150?u=186') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (187, 'rockstar187@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (187, 'Star 187 RHCP', 'IntermediÃ¡rio', 163, 89, 'https://i.pravatar.cc/150?u=187') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (188, 'rockstar188@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (188, 'Star 188 Radiohead', 'IntermediÃ¡rio', 160, 69, 'https://i.pravatar.cc/150?u=188') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (189, 'rockstar189@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (189, 'Star 189 The Strokes', 'Iniciante', 181, 76, 'https://i.pravatar.cc/150?u=189') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (190, 'rockstar190@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (190, 'Star 190 Nirvana', 'IntermediÃ¡rio', 179, 86, 'https://i.pravatar.cc/150?u=190') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (191, 'rockstar191@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (191, 'Star 191 Pearl Jam', 'Iniciante', 174, 60, 'https://i.pravatar.cc/150?u=191') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (192, 'rockstar192@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (192, 'Star 192 Alice in Chains', 'IntermediÃ¡rio', 173, 62, 'https://i.pravatar.cc/150?u=192') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (193, 'rockstar193@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (193, 'Star 193 Soundgarden', 'IntermediÃ¡rio', 184, 92, 'https://i.pravatar.cc/150?u=193') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (194, 'rockstar194@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (194, 'Star 194 Linkin Park', 'AvanÃ§ado', 171, 93, 'https://i.pravatar.cc/150?u=194') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (195, 'rockstar195@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (195, 'Star 195 Foo Fighters', 'Iniciante', 182, 83, 'https://i.pravatar.cc/150?u=195') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (196, 'rockstar196@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (196, 'Star 196 Green Day', 'AvanÃ§ado', 189, 93, 'https://i.pravatar.cc/150?u=196') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (197, 'rockstar197@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (197, 'Star 197 RHCP', 'AvanÃ§ado', 168, 63, 'https://i.pravatar.cc/150?u=197') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (198, 'rockstar198@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (198, 'Star 198 Radiohead', 'Iniciante', 170, 67, 'https://i.pravatar.cc/150?u=198') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (199, 'rockstar199@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (199, 'Star 199 The Strokes', 'AvanÃ§ado', 168, 72, 'https://i.pravatar.cc/150?u=199') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (200, 'rockstar200@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (200, 'Star 200 Nirvana', 'Iniciante', 169, 77, 'https://i.pravatar.cc/150?u=200') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (201, 'rockstar201@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (201, 'Star 201 Pearl Jam', 'AvanÃ§ado', 163, 68, 'https://i.pravatar.cc/150?u=201') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (202, 'rockstar202@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (202, 'Star 202 Alice in Chains', 'IntermediÃ¡rio', 174, 92, 'https://i.pravatar.cc/150?u=202') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (203, 'rockstar203@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (203, 'Star 203 Soundgarden', 'Iniciante', 184, 84, 'https://i.pravatar.cc/150?u=203') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (204, 'rockstar204@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (204, 'Star 204 Linkin Park', 'AvanÃ§ado', 183, 81, 'https://i.pravatar.cc/150?u=204') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (205, 'rockstar205@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (205, 'Star 205 Foo Fighters', 'AvanÃ§ado', 176, 65, 'https://i.pravatar.cc/150?u=205') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (206, 'rockstar206@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (206, 'Star 206 Green Day', 'Iniciante', 164, 66, 'https://i.pravatar.cc/150?u=206') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (207, 'rockstar207@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (207, 'Star 207 RHCP', 'Iniciante', 160, 66, 'https://i.pravatar.cc/150?u=207') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (208, 'rockstar208@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (208, 'Star 208 Radiohead', 'IntermediÃ¡rio', 178, 79, 'https://i.pravatar.cc/150?u=208') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (209, 'rockstar209@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (209, 'Star 209 The Strokes', 'Iniciante', 183, 68, 'https://i.pravatar.cc/150?u=209') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (210, 'rockstar210@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (210, 'Star 210 Nirvana', 'AvanÃ§ado', 177, 85, 'https://i.pravatar.cc/150?u=210') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (211, 'rockstar211@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (211, 'Star 211 Pearl Jam', 'Iniciante', 177, 72, 'https://i.pravatar.cc/150?u=211') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (212, 'rockstar212@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (212, 'Star 212 Alice in Chains', 'AvanÃ§ado', 161, 87, 'https://i.pravatar.cc/150?u=212') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (213, 'rockstar213@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (213, 'Star 213 Soundgarden', 'IntermediÃ¡rio', 161, 77, 'https://i.pravatar.cc/150?u=213') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (214, 'rockstar214@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (214, 'Star 214 Linkin Park', 'Iniciante', 179, 66, 'https://i.pravatar.cc/150?u=214') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (215, 'rockstar215@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (215, 'Star 215 Foo Fighters', 'Iniciante', 163, 60, 'https://i.pravatar.cc/150?u=215') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (216, 'rockstar216@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (216, 'Star 216 Green Day', 'Iniciante', 188, 70, 'https://i.pravatar.cc/150?u=216') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (217, 'rockstar217@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (217, 'Star 217 RHCP', 'AvanÃ§ado', 163, 64, 'https://i.pravatar.cc/150?u=217') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (218, 'rockstar218@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (218, 'Star 218 Radiohead', 'AvanÃ§ado', 164, 92, 'https://i.pravatar.cc/150?u=218') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (219, 'rockstar219@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (219, 'Star 219 The Strokes', 'Iniciante', 172, 72, 'https://i.pravatar.cc/150?u=219') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (220, 'rockstar220@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (220, 'Star 220 Nirvana', 'Iniciante', 186, 94, 'https://i.pravatar.cc/150?u=220') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (221, 'rockstar221@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (221, 'Star 221 Pearl Jam', 'AvanÃ§ado', 188, 72, 'https://i.pravatar.cc/150?u=221') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (222, 'rockstar222@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (222, 'Star 222 Alice in Chains', 'IntermediÃ¡rio', 175, 67, 'https://i.pravatar.cc/150?u=222') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (223, 'rockstar223@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (223, 'Star 223 Soundgarden', 'AvanÃ§ado', 163, 75, 'https://i.pravatar.cc/150?u=223') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (224, 'rockstar224@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (224, 'Star 224 Linkin Park', 'AvanÃ§ado', 163, 90, 'https://i.pravatar.cc/150?u=224') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (225, 'rockstar225@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (225, 'Star 225 Foo Fighters', 'IntermediÃ¡rio', 168, 73, 'https://i.pravatar.cc/150?u=225') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (226, 'rockstar226@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (226, 'Star 226 Green Day', 'AvanÃ§ado', 185, 71, 'https://i.pravatar.cc/150?u=226') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (227, 'rockstar227@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (227, 'Star 227 RHCP', 'AvanÃ§ado', 167, 83, 'https://i.pravatar.cc/150?u=227') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (228, 'rockstar228@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (228, 'Star 228 Radiohead', 'IntermediÃ¡rio', 161, 76, 'https://i.pravatar.cc/150?u=228') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (229, 'rockstar229@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (229, 'Star 229 The Strokes', 'AvanÃ§ado', 174, 89, 'https://i.pravatar.cc/150?u=229') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (230, 'rockstar230@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (230, 'Star 230 Nirvana', 'Iniciante', 169, 84, 'https://i.pravatar.cc/150?u=230') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (231, 'rockstar231@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (231, 'Star 231 Pearl Jam', 'AvanÃ§ado', 184, 73, 'https://i.pravatar.cc/150?u=231') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (232, 'rockstar232@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (232, 'Star 232 Alice in Chains', 'IntermediÃ¡rio', 170, 70, 'https://i.pravatar.cc/150?u=232') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (233, 'rockstar233@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (233, 'Star 233 Soundgarden', 'Iniciante', 164, 92, 'https://i.pravatar.cc/150?u=233') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (234, 'rockstar234@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (234, 'Star 234 Linkin Park', 'Iniciante', 167, 62, 'https://i.pravatar.cc/150?u=234') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (235, 'rockstar235@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (235, 'Star 235 Foo Fighters', 'IntermediÃ¡rio', 174, 93, 'https://i.pravatar.cc/150?u=235') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (236, 'rockstar236@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (236, 'Star 236 Green Day', 'Iniciante', 162, 62, 'https://i.pravatar.cc/150?u=236') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (237, 'rockstar237@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (237, 'Star 237 RHCP', 'Iniciante', 179, 77, 'https://i.pravatar.cc/150?u=237') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (238, 'rockstar238@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (238, 'Star 238 Radiohead', 'IntermediÃ¡rio', 170, 88, 'https://i.pravatar.cc/150?u=238') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (239, 'rockstar239@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (239, 'Star 239 The Strokes', 'AvanÃ§ado', 175, 82, 'https://i.pravatar.cc/150?u=239') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (240, 'rockstar240@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (240, 'Star 240 Nirvana', 'IntermediÃ¡rio', 170, 84, 'https://i.pravatar.cc/150?u=240') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (241, 'rockstar241@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (241, 'Star 241 Pearl Jam', 'Iniciante', 183, 83, 'https://i.pravatar.cc/150?u=241') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (242, 'rockstar242@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (242, 'Star 242 Alice in Chains', 'IntermediÃ¡rio', 181, 91, 'https://i.pravatar.cc/150?u=242') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (243, 'rockstar243@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (243, 'Star 243 Soundgarden', 'IntermediÃ¡rio', 179, 84, 'https://i.pravatar.cc/150?u=243') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (244, 'rockstar244@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (244, 'Star 244 Linkin Park', 'AvanÃ§ado', 183, 90, 'https://i.pravatar.cc/150?u=244') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (245, 'rockstar245@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (245, 'Star 245 Foo Fighters', 'Iniciante', 160, 93, 'https://i.pravatar.cc/150?u=245') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (246, 'rockstar246@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (246, 'Star 246 Green Day', 'Iniciante', 177, 90, 'https://i.pravatar.cc/150?u=246') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (247, 'rockstar247@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (247, 'Star 247 RHCP', 'IntermediÃ¡rio', 172, 63, 'https://i.pravatar.cc/150?u=247') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (248, 'rockstar248@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (248, 'Star 248 Radiohead', 'AvanÃ§ado', 167, 84, 'https://i.pravatar.cc/150?u=248') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (249, 'rockstar249@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (249, 'Star 249 The Strokes', 'Iniciante', 175, 66, 'https://i.pravatar.cc/150?u=249') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (250, 'rockstar250@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (250, 'Star 250 Nirvana', 'AvanÃ§ado', 168, 87, 'https://i.pravatar.cc/150?u=250') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (251, 'rockstar251@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (251, 'Star 251 Pearl Jam', 'Iniciante', 182, 92, 'https://i.pravatar.cc/150?u=251') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (252, 'rockstar252@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (252, 'Star 252 Alice in Chains', 'AvanÃ§ado', 185, 73, 'https://i.pravatar.cc/150?u=252') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (253, 'rockstar253@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (253, 'Star 253 Soundgarden', 'IntermediÃ¡rio', 160, 92, 'https://i.pravatar.cc/150?u=253') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (254, 'rockstar254@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (254, 'Star 254 Linkin Park', 'Iniciante', 186, 82, 'https://i.pravatar.cc/150?u=254') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (255, 'rockstar255@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (255, 'Star 255 Foo Fighters', 'Iniciante', 163, 88, 'https://i.pravatar.cc/150?u=255') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (256, 'rockstar256@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (256, 'Star 256 Green Day', 'AvanÃ§ado', 166, 85, 'https://i.pravatar.cc/150?u=256') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (257, 'rockstar257@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (257, 'Star 257 RHCP', 'Iniciante', 178, 87, 'https://i.pravatar.cc/150?u=257') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (258, 'rockstar258@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (258, 'Star 258 Radiohead', 'IntermediÃ¡rio', 172, 79, 'https://i.pravatar.cc/150?u=258') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (259, 'rockstar259@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (259, 'Star 259 The Strokes', 'AvanÃ§ado', 181, 73, 'https://i.pravatar.cc/150?u=259') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (260, 'rockstar260@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (260, 'Star 260 Nirvana', 'IntermediÃ¡rio', 163, 64, 'https://i.pravatar.cc/150?u=260') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (261, 'rockstar261@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (261, 'Star 261 Pearl Jam', 'AvanÃ§ado', 182, 82, 'https://i.pravatar.cc/150?u=261') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (262, 'rockstar262@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (262, 'Star 262 Alice in Chains', 'Iniciante', 189, 85, 'https://i.pravatar.cc/150?u=262') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (263, 'rockstar263@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (263, 'Star 263 Soundgarden', 'Iniciante', 165, 86, 'https://i.pravatar.cc/150?u=263') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (264, 'rockstar264@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (264, 'Star 264 Linkin Park', 'Intermediário', 164, 83, 'https://i.pravatar.cc/150?u=264') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (265, 'rockstar265@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (265, 'Star 265 Foo Fighters', 'Avançado', 163, 68, 'https://i.pravatar.cc/150?u=265') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (266, 'rockstar266@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (266, 'Star 266 Green Day', 'Avançado', 168, 67, 'https://i.pravatar.cc/150?u=266') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (267, 'rockstar267@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (267, 'Star 267 RHCP', 'Avançado', 166, 94, 'https://i.pravatar.cc/150?u=267') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (268, 'rockstar268@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (268, 'Star 268 Radiohead', 'Iniciante', 172, 62, 'https://i.pravatar.cc/150?u=268') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (269, 'rockstar269@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (269, 'Star 269 The Strokes', 'Iniciante', 170, 90, 'https://i.pravatar.cc/150?u=269') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (270, 'rockstar270@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (270, 'Star 270 Nirvana', 'Avançado', 182, 75, 'https://i.pravatar.cc/150?u=270') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (271, 'rockstar271@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (271, 'Star 271 Pearl Jam', 'Iniciante', 181, 76, 'https://i.pravatar.cc/150?u=271') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (272, 'rockstar272@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (272, 'Star 272 Alice in Chains', 'Avançado', 165, 78, 'https://i.pravatar.cc/150?u=272') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (273, 'rockstar273@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (273, 'Star 273 Soundgarden', 'Iniciante', 168, 72, 'https://i.pravatar.cc/150?u=273') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (274, 'rockstar274@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (274, 'Star 274 Linkin Park', 'Iniciante', 186, 94, 'https://i.pravatar.cc/150?u=274') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (275, 'rockstar275@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (275, 'Star 275 Foo Fighters', 'Iniciante', 181, 66, 'https://i.pravatar.cc/150?u=275') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (276, 'rockstar276@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (276, 'Star 276 Green Day', 'Iniciante', 169, 69, 'https://i.pravatar.cc/150?u=276') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (277, 'rockstar277@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (277, 'Star 277 RHCP', 'Avançado', 174, 84, 'https://i.pravatar.cc/150?u=277') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (278, 'rockstar278@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (278, 'Star 278 Radiohead', 'Intermediário', 182, 89, 'https://i.pravatar.cc/150?u=278') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (279, 'rockstar279@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (279, 'Star 279 The Strokes', 'Avançado', 165, 77, 'https://i.pravatar.cc/150?u=279') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (280, 'rockstar280@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (280, 'Star 280 Nirvana', 'Iniciante', 160, 69, 'https://i.pravatar.cc/150?u=280') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (281, 'rockstar281@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (281, 'Star 281 Pearl Jam', 'Intermediário', 184, 63, 'https://i.pravatar.cc/150?u=281') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (282, 'rockstar282@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (282, 'Star 282 Alice in Chains', 'Intermediário', 180, 75, 'https://i.pravatar.cc/150?u=282') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (283, 'rockstar283@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (283, 'Star 283 Soundgarden', 'Avançado', 174, 65, 'https://i.pravatar.cc/150?u=283') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (284, 'rockstar284@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (284, 'Star 284 Linkin Park', 'Intermediário', 169, 67, 'https://i.pravatar.cc/150?u=284') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (285, 'rockstar285@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (285, 'Star 285 Foo Fighters', 'Avançado', 166, 73, 'https://i.pravatar.cc/150?u=285') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (286, 'rockstar286@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (286, 'Star 286 Green Day', 'Iniciante', 180, 84, 'https://i.pravatar.cc/150?u=286') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (287, 'rockstar287@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (287, 'Star 287 RHCP', 'Avançado', 164, 76, 'https://i.pravatar.cc/150?u=287') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (288, 'rockstar288@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (288, 'Star 288 Radiohead', 'Intermediário', 165, 84, 'https://i.pravatar.cc/150?u=288') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (289, 'rockstar289@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (289, 'Star 289 The Strokes', 'Intermediário', 160, 92, 'https://i.pravatar.cc/150?u=289') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (290, 'rockstar290@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (290, 'Star 290 Nirvana', 'Intermediário', 182, 86, 'https://i.pravatar.cc/150?u=290') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (291, 'rockstar291@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (291, 'Star 291 Pearl Jam', 'Iniciante', 183, 74, 'https://i.pravatar.cc/150?u=291') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (292, 'rockstar292@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (292, 'Star 292 Alice in Chains', 'Intermediário', 167, 67, 'https://i.pravatar.cc/150?u=292') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (293, 'rockstar293@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (293, 'Star 293 Soundgarden', 'Intermediário', 186, 63, 'https://i.pravatar.cc/150?u=293') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (294, 'rockstar294@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (294, 'Star 294 Linkin Park', 'Iniciante', 169, 60, 'https://i.pravatar.cc/150?u=294') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (295, 'rockstar295@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (295, 'Star 295 Foo Fighters', 'Intermediário', 176, 77, 'https://i.pravatar.cc/150?u=295') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (296, 'rockstar296@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (296, 'Star 296 Green Day', 'Avançado', 164, 90, 'https://i.pravatar.cc/150?u=296') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (297, 'rockstar297@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (297, 'Star 297 RHCP', 'Iniciante', 170, 66, 'https://i.pravatar.cc/150?u=297') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (298, 'rockstar298@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (298, 'Star 298 Radiohead', 'Iniciante', 174, 84, 'https://i.pravatar.cc/150?u=298') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_usuarios (id_usuario, dsc_email, dsc_senha_hash) VALUES (299, 'rockstar299@spin4all.com', '$2b$10$Ia50Nd2c34Wy3aoqe8Ym2OcvLNUN1D3HED9U1WYoxIrOryer67Mty') ON CONFLICT DO NOTHING;
INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico, num_altura_cm, num_peso_kg, dsc_foto_perfil) VALUES (299, 'Star 299 The Strokes', 'Avançado', 185, 82, 'https://i.pravatar.cc/150?u=299') ON CONFLICT DO NOTHING;

-- Resultados de Torneio para o Ranking
INSERT INTO trusted.tb_torneios_resultados (id_usuario, num_posicao, dsc_torneio_nome, dt_torneio) VALUES
(1, 1, 'Torneio Inaugural', CURRENT_DATE - INTERVAL '2 months'),
(99, 2, 'Torneio Inaugural', CURRENT_DATE - INTERVAL '2 months'),
(100, 3, 'Torneio Inaugural', CURRENT_DATE - INTERVAL '2 months'),
(101, 4, 'Torneio Inaugural', CURRENT_DATE - INTERVAL '2 months')
ON CONFLICT DO NOTHING;

-----------------------------------------------------------
-- 7. MASSIVE DATA SIMULATION (DASHBOARD & ADMIN)
-----------------------------------------------------------

-- 1. Check-ins para os últimos 30 dias (Simulação de Frequência)
-- 1. Check-ins Históricos (60 dias para volume consistente no dashboard)
INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin)
SELECT u.id_usuario, (CURRENT_DATE - i * INTERVAL '1 day')::date
FROM trusted.tb_usuarios u, generate_series(0, 60) i
WHERE (u.id_usuario + i) % 4 = 0 OR (u.id_usuario % 10 = 0)
ON CONFLICT DO NOTHING;

-- 1.1 Check-ins para HOJE (Contador em tempo real)
INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin)
SELECT id_usuario, CURRENT_DATE
FROM trusted.tb_usuarios 
WHERE id_usuario % 5 = 0
ON CONFLICT DO NOTHING;

-- 2. Demografia Realista (5 Faixas Etárias para o novo gráfico)
UPDATE trusted.tb_membros_perfil mp
SET dt_nascimento = CASE
    WHEN mp.id_usuario % 5 = 0 THEN (CURRENT_DATE - (14 + floor(random() * 5))::int * INTERVAL '365 day')::date
    WHEN mp.id_usuario % 5 = 1 THEN (CURRENT_DATE - (20 + floor(random() * 10))::int * INTERVAL '365 day')::date
    WHEN mp.id_usuario % 5 = 2 THEN (CURRENT_DATE - (30 + floor(random() * 10))::int * INTERVAL '365 day')::date
    WHEN mp.id_usuario % 5 = 3 THEN (CURRENT_DATE - (40 + floor(random() * 10))::int * INTERVAL '365 day')::date
    ELSE (CURRENT_DATE - (50 + floor(random() * 20))::int * INTERVAL '365 day')::date
END,
dsc_objetivo = CASE 
    WHEN mp.id_usuario % 2 = 0 THEN 'Competitivo'
    ELSE 'Saúde'
END
FROM trusted.tb_usuarios u
WHERE mp.id_usuario = u.id_usuario;

-- 3. Alertas Biomecânicos (Simular 3 casos críticos: IMC > 28 + Frequência Alta)
-- Primeiro garantir peso/altura elevada para alguns (os 3 primeiros da base)
UPDATE trusted.tb_membros_perfil 
SET num_peso_kg = 105, num_altura_cm = 175 -- IMC ~34.3
WHERE id_usuario IN (SELECT id_usuario FROM trusted.tb_usuarios ORDER BY id_usuario LIMIT 3);

-- 4. Normalização de Níveis (Iniciante, Intermediário, Avançado)
UPDATE trusted.tb_membros_perfil 
SET dsc_nivel_tecnico = CASE 
    WHEN id_usuario % 3 = 0 THEN 'Iniciante'
    WHEN id_usuario % 3 = 1 THEN 'Intermediário'
    ELSE 'Avançado'
END;

-- Garantir frequência alta para os 3 primeiros casos de risco
INSERT INTO trusted.tb_checkins (id_usuario, dt_checkin)
SELECT u.id_usuario, d
FROM (SELECT id_usuario FROM trusted.tb_usuarios ORDER BY id_usuario LIMIT 3) u
CROSS JOIN (
    SELECT (CURRENT_DATE - i * INTERVAL '1 day')::date as d 
    FROM generate_series(1, 20) i 
) dates
ON CONFLICT DO NOTHING;

-- 4. Distribuição Técnica para o Gráfico DNA
UPDATE trusted.tb_membros_perfil 
SET dsc_nivel_tecnico = CASE 
    WHEN id_usuario % 5 = 0 THEN 'Avançado'
    WHEN id_usuario % 5 = 1 THEN 'Iniciante'
    WHEN id_usuario % 5 = 2 THEN 'Intermediário'
    ELSE 'Avançado' -- Removido 'Profissional' para manter apenas 3 níveis
END;

-- 5. Objetivos para Segmentação Inteligente (Ricos para gerar Tags)
UPDATE trusted.tb_membros_perfil 
SET dsc_metas = CASE 
    -- Técnico
    WHEN id_usuario % 10 = 0 THEN 'Melhorar técnica de forehand, consistência no topspin e recepção de saque curto. Foco total em fundamentos.'
    WHEN id_usuario % 10 = 1 THEN 'Aprimorar backhand agressivo, transição para o ataque e movimentação lateral. Treino de multibol.'
    -- Físico
    WHEN id_usuario % 10 = 2 THEN 'Prevenção de lesões no ombro, aumento de flexibilidade e resistência cardiovascular para rallies longos.'
    WHEN id_usuario % 10 = 3 THEN 'Fortalecimento de core e pernas, perda de peso para melhorar agilidade e tempo de reação à mesa.'
    -- Competição
    WHEN id_usuario % 10 = 4 THEN 'Preparação para o torneio estadual, ganhar confiança em jogos decisivos e subir no ranking da federação.'
    WHEN id_usuario % 10 = 5 THEN 'Estudar táticas de jogo, analisar vídeos de adversários e participar de pelo menos 3 opens este semestre.'
    -- Social / Lazer
    WHEN id_usuario % 10 = 6 THEN 'Manter a saúde mental através do esporte, interação social com outros membros e diversão nos finais de semana.'
    WHEN id_usuario % 10 = 7 THEN 'Hobby relaxante após o trabalho, aprender o básico do tênis de mesa e fazer novos amigos no clube.'
    -- Variados / Mistos
    WHEN id_usuario % 10 = 8 THEN 'Aprender saques com efeito lateral, melhorar o controle de bloqueio e aumentar a frequência semanal.'
    ELSE 'Dominar a técnica de cozinhada agressiva, melhorar o saque rápido e participar de competições internas do grupo.'
END;

-- 6. Randomizar Skills para Radar
UPDATE trusted.tb_membros_perfil 
SET 
  num_skill_forehand = (40 + floor(random() * 40))::int,
  num_skill_backhand = (30 + floor(random() * 50))::int,
  num_skill_cozinhada = (50 + floor(random() * 30))::int,
  num_skill_topspin = (20 + floor(random() * 60))::int,
  num_skill_saque = (45 + floor(random() * 45))::int,
  num_skill_rally = (35 + floor(random() * 55))::int,
  num_skill_ataque = (40 + floor(random() * 50))::int,
  num_skill_defesa = (30 + floor(random() * 60))::int,
  num_skill_bloqueio = (45 + floor(random() * 45))::int,
  num_skill_controle = (50 + floor(random() * 40))::int,
  num_skill_movimentacao = (25 + floor(random() * 65))::int
WHERE id_usuario > 0;

-- 7. Evolução Histórica (Ranking Mensal) - 30 DIAS PARA TODOS OS MEMBROS
-- Gera 30 registros por membro com uma tendência ACENDENTE REAL para a Vanguarda do Mês
INSERT INTO trusted.tb_membros_evolucao (id_usuario, num_skill_avg_total, dt_registro)
SELECT 
    u.id_usuario, 
    (30 + floor(random() * 20) + (i * 0.8))::float as skill, -- Crescimento mais visível (0.8 por dia)
    (CURRENT_DATE - (30 - i) * INTERVAL '1 day')::date
FROM trusted.tb_usuarios u
CROSS JOIN generate_series(1, 30) i
ON CONFLICT DO NOTHING;

-- Atualizar telefone para membros que não são Rockstars (simulação)
UPDATE trusted.tb_membros_perfil 
SET num_telefone = '(11) 9' || floor(random() * 90000000 + 10000000)::text
WHERE num_telefone IS NULL OR num_telefone = '';

-- 8. Vitral de Conquistas (Badges para a Home)
INSERT INTO trusted.tb_usuarios_badges (id_usuario, id_badge, dt_conquista)
SELECT u.id_usuario, b.id_badge, CURRENT_DATE - (u.id_usuario % 10) * INTERVAL '1 day'
FROM trusted.tb_usuarios u
CROSS JOIN (SELECT id_badge FROM trusted.tb_badges_definicao LIMIT 3) b
WHERE u.id_usuario % 7 = 0
ON CONFLICT DO NOTHING;

-- Garantir que o Hall da Fama tenha pelo menos 5 nomes com pontos variados
DELETE FROM trusted.tb_torneios_resultados;
INSERT INTO trusted.tb_torneios_resultados (id_usuario, num_posicao, dsc_torneio_nome, dt_torneio) VALUES
(1, 1, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
(99, 2, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
(100, 3, 'Copa Spin4All Março', CURRENT_DATE - INTERVAL '10 days'),
(101, 1, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days'),
(102, 2, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days'),
(103, 3, 'Open de Fevereiro', CURRENT_DATE - INTERVAL '40 days'),
(104, 1, 'Inaugural Jan', CURRENT_DATE - INTERVAL '70 days'),
(110, 2, 'Inaugural Jan', CURRENT_DATE - INTERVAL '70 days'),
(113, 3, 'Inaugural Jan', CURRENT_DATE - INTERVAL '70 days');

