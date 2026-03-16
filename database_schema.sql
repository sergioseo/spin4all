-- =========================================================
-- COMANDO DE RESET TOTAL (USE COM CUIDADO)
-- Este script apaga TUDO e reconstrói as 3 camadas do zero.
-- =========================================================
DROP SCHEMA IF EXISTS raw CASCADE;
DROP SCHEMA IF EXISTS trusted CASCADE;
DROP SCHEMA IF EXISTS refined CASCADE;

-- CRIAÇÃO DAS CAMADAS (SCHEMAS)
CREATE SCHEMA IF NOT EXISTS raw;     
CREATE SCHEMA IF NOT EXISTS trusted; 
CREATE SCHEMA IF NOT EXISTS refined; 

-----------------------------------------------------------
-- 1. CAMADA RAW (Ingestão e Auditoria)
-----------------------------------------------------------

-- Tabela de Ingestão do Onboarding (Caminho inicial)
CREATE TABLE IF NOT EXISTS raw.tb_onboarding_submissions (
    id_submissao SERIAL PRIMARY KEY,
    jsn_payload JSONB NOT NULL,
    vlr_status_processamento VARCHAR(20) DEFAULT 'pendente',
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Auditoria Obrigatória (Para alterações de perfil)
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

-- Autenticação
CREATE TABLE IF NOT EXISTS trusted.tb_usuarios (
    id_usuario SERIAL PRIMARY KEY,
    dsc_email VARCHAR(255) UNIQUE NOT NULL,
    dsc_senha_hash VARCHAR(255) NOT NULL,
    vlr_status_conta VARCHAR(20) DEFAULT 'ativo',
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_ultimo_login TIMESTAMP
);

-- Dados de Perfil Estruturados (Estado Atual)
CREATE TABLE IF NOT EXISTS trusted.tb_membros_perfil (
    id_perfil SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dsc_nome_completo VARCHAR(255) NOT NULL,
    dsc_lateralidade VARCHAR(20),
    dsc_empunhadura VARCHAR(50),
    dsc_nivel_tecnico VARCHAR(50),
    dsc_objetivo VARCHAR(100),
    dsc_metas TEXT,
    num_altura_cm INTEGER,
    num_peso_kg NUMERIC(5,2), -- Suporta decimais (ex: 85.5)
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Evolução do Membro (Histórico de medidas)
CREATE TABLE IF NOT EXISTS trusted.tb_membros_evolucao (
    id_evolucao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    num_peso_kg NUMERIC(5,2),
    num_altura_cm INTEGER,
    dsc_nivel_tecnico VARCHAR(50),
    dt_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Check-ins (Presença Presencial)
CREATE TABLE IF NOT EXISTS trusted.tb_checkins (
    id_checkin SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) ON DELETE CASCADE,
    dt_checkin DATE DEFAULT CURRENT_DATE,
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, dt_checkin) -- Garante apenas um check-in por dia por aluno
);

-----------------------------------------------------------
-- 3. CAMADA REFINED (Consumo/Dashboards)
-----------------------------------------------------------

-- VIEW 1: Perfil Biomecânico e IMC Atual
CREATE OR REPLACE VIEW refined.vw_analise_biomecanica AS
SELECT 
    id_perfil,
    dsc_nome_completo,
    num_altura_cm,
    num_peso_kg,
    ROUND(num_peso_kg / ((num_altura_cm/100.0)^2), 2) as num_imc,
    CASE 
        WHEN num_peso_kg / ((num_altura_cm/100.0)^2) < 18.5 THEN 'Abaixo do peso'
        WHEN num_peso_kg / ((num_altura_cm/100.0)^2) BETWEEN 18.5 AND 24.9 THEN 'Peso ideal'
        ELSE 'Acima do peso'
    END as dsc_status_imc
FROM trusted.tb_membros_perfil;

-- VIEW 2: Histórico de Evolução (Pronto para Gráficos)
CREATE OR REPLACE VIEW refined.vw_evolucao_membro AS
SELECT 
    id_usuario,
    num_peso_kg,
    num_altura_cm,
    ROUND(num_peso_kg / ((num_altura_cm/100.0)^2), 2) as num_imc,
    dsc_nivel_tecnico,
    dt_registro as dt_evento
FROM trusted.tb_membros_evolucao
ORDER BY id_usuario, dt_registro ASC;

-- VIEW 3: Segmentação de Nível Técnico
CREATE OR REPLACE VIEW refined.vw_segmentacao_nivel AS
SELECT 
    dsc_nivel_tecnico,
    COUNT(*) as num_membros,
    MAX(dt_atualizacao) as dt_ultima_entrada
FROM trusted.tb_membros_perfil
GROUP BY dsc_nivel_tecnico
ORDER BY num_membros DESC;

-- VIEW 4: Crescimento Mensal
CREATE OR REPLACE VIEW refined.vw_crescimento_mensal AS
SELECT 
    DATE_TRUNC('month', dt_criacao_registro) as dt_mes,
    COUNT(*) as num_novos_membros
FROM trusted.tb_usuarios
GROUP BY dt_mes
ORDER BY dt_mes DESC;

-- VIEW 5: Frequência Mensal e Qualificação para Torneios
CREATE OR REPLACE VIEW refined.vw_frequencia_mensal AS
WITH stats AS (
    SELECT 
        id_usuario,
        COUNT(*) as num_presencas,
        -- Assumindo 12 treinos por mês como base (3 por semana)
        12.0 as num_treinos_esperados 
    FROM trusted.tb_checkins
    WHERE dt_checkin >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY id_usuario
)
SELECT 
    s.id_usuario,
    p.dsc_nome_completo,
    s.num_presencas,
    ROUND((s.num_presencas / s.num_treinos_esperados) * 100, 2) as pct_frequencia,
    CASE 
        WHEN (s.num_presencas / s.num_treinos_esperados) * 100 >= 70 THEN 'Qualificado ✅'
        ELSE 'Pendente ❌'
    END as dsc_status_torneio
FROM stats s
JOIN trusted.tb_membros_perfil p ON s.id_usuario = p.id_usuario;

-----------------------------------------------------------
-- INDEXES PARA PERFORMANCE
-----------------------------------------------------------
CREATE INDEX idx_trusted_usuarios_email ON trusted.tb_usuarios(dsc_email);
CREATE INDEX idx_raw_status ON raw.tb_onboarding_submissions(vlr_status_processamento);
CREATE INDEX idx_evolucao_usuario ON trusted.tb_membros_evolucao(id_usuario, dt_registro);
CREATE INDEX idx_checkins_usuario_data ON trusted.tb_checkins(id_usuario, dt_checkin);
