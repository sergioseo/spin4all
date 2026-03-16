-- =========================================================
-- COMANDO DE RESET TOTAL (USE COM CUIDADO)
-- =========================================================
-- DROP SCHEMA IF EXISTS raw CASCADE;
-- DROP SCHEMA IF EXISTS trusted CASCADE;
-- DROP SCHEMA IF EXISTS refined CASCADE;

-- CRIAÇÃO DAS CAMADAS (SCHEMAS)
CREATE SCHEMA IF NOT EXISTS raw;     
CREATE SCHEMA IF NOT EXISTS trusted; 
CREATE SCHEMA IF NOT EXISTS refined; 

-----------------------------------------------------------
-- 1. CAMADA RAW (Ingestão Direta)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw.tb_onboarding_submissions (
    id_submissao SERIAL PRIMARY KEY,
    jsn_payload JSONB NOT NULL,
    vlr_status_processamento VARCHAR(20) DEFAULT 'pendente',
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Dados de Perfil Estruturados
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
    num_peso_kg INTEGER,
    dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------------------
-- 3. CAMADA REFINED (Consumo/Dashboard)
-----------------------------------------------------------

-- VIEW 1: Perfil Biomecânico e IMC (Análise de Saúde/Físico)
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

-- VIEW 2: Matriz de Equipamento (Lateratidade x Empunhadura)
CREATE OR REPLACE VIEW refined.vw_matriz_tecnica AS
SELECT 
    dsc_lateralidade,
    dsc_empunhadura,
    COUNT(*) as num_total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pct_representatividade
FROM trusted.tb_membros_perfil
GROUP BY dsc_lateralidade, dsc_empunhadura;

-- VIEW 3: Funil de Nível Técnico (Segmentação de Comunidade)
CREATE OR REPLACE VIEW refined.vw_segmentacao_nivel AS
SELECT 
    dsc_nivel_tecnico,
    COUNT(*) as num_membros,
    MAX(dt_atualizacao) as dt_ultima_entrada
FROM trusted.tb_membros_perfil
GROUP BY dsc_nivel_tecnico
ORDER BY num_membros DESC;

-- VIEW 4: Tendência de Crescimento Mensal (Sazonalidade)
CREATE OR REPLACE VIEW refined.vw_crescimento_mensal AS
SELECT 
    DATE_TRUNC('month', dt_criacao_registro) as dt_mes,
    COUNT(*) as num_novos_membros
FROM trusted.tb_usuarios
GROUP BY dt_mes
ORDER BY dt_mes DESC;

-- VIEW 5: Master View de Alunos (Export para Excel/BI)
CREATE OR REPLACE VIEW refined.vw_master_report_alunos AS
SELECT 
    u.id_usuario,
    u.dsc_email,
    p.dsc_nome_completo,
    p.dsc_nivel_tecnico,
    p.dsc_empunhadura,
    p.num_altura_cm,
    p.num_peso_kg,
    u.dt_criacao_registro
FROM trusted.tb_usuarios u
JOIN trusted.tb_membros_perfil p ON u.id_usuario = p.id_usuario;

-- INDEXES PARA PERFORMANCE
CREATE INDEX idx_trusted_usuarios_email ON trusted.tb_usuarios(dsc_email);
CREATE INDEX idx_raw_status ON raw.tb_onboarding_submissions(vlr_status_processamento);
