-- ARQUITETURA DE MAESTRIA TÉCNICA (SPIN4ALL)

-- 1. Tabela de Histórico de Diagnósticos (Para o Gráfico de Evolução)
CREATE TABLE IF NOT EXISTS trusted.tb_diagnostico_historico (
    id_diagnostico SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
    dt_referencia TIMESTAMP DEFAULT CURRENT_DATE,
    jsn_respostas JSONB, -- Armazena as 17 respostas brutas para análise de dados
    num_score_geral FLOAT,
    dsc_perfil_estilo TEXT, -- ex: "Ofensivo de Controle"
    num_skill_forehand INTEGER,
    num_skill_backhand INTEGER,
    num_skill_saque INTEGER,
    num_skill_consistency INTEGER,
    num_skill_ataque INTEGER,
    num_skill_defesa INTEGER,
    num_skill_controle INTEGER,
    num_skill_movimentacao INTEGER
);

-- 2. Tabela de Missões Semanais (O Mural de Metas)
CREATE TABLE IF NOT EXISTS trusted.tb_missoes_usuario (
    id_missao SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
    dt_inicio DATE DEFAULT CURRENT_DATE,
    dt_limite DATE, -- Geralmente o domingo da mesma semana
    dsc_titulo TEXT NOT NULL,
    dsc_descricao TEXT,
    dsc_categoria TEXT, -- "Técnica", "Física", "Saúde"
    num_xp_recompensa INTEGER DEFAULT 250,
    flg_concluida BOOLEAN DEFAULT FALSE,
    dt_conclusao TIMESTAMP
);

-- 3. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_diagnostico_usuario ON trusted.tb_diagnostico_historico(id_usuario);
CREATE INDEX IF NOT EXISTS idx_missoes_usuario ON trusted.tb_missoes_usuario(id_usuario, dt_inicio);
