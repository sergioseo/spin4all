const pool = require('./db');
const { BADGE_TEMPLATES } = require('./constants');

const runMigrations = async () => {
    try {
      console.log('--- Verificando Migrações ---');
      await pool.query('CREATE SCHEMA IF NOT EXISTS raw');
      await pool.query('CREATE SCHEMA IF NOT EXISTS staging');
      await pool.query('CREATE SCHEMA IF NOT EXISTS trusted');
      await pool.query('CREATE SCHEMA IF NOT EXISTS refined');
      await pool.query('CREATE SCHEMA IF NOT EXISTS sandbox');
      await pool.query('CREATE SCHEMA IF NOT EXISTS governance');

      // 1. Usuarios e Autenticação
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted.tb_usuarios (
          id_usuario SERIAL PRIMARY KEY,
          dsc_email VARCHAR(255) UNIQUE NOT NULL,
          dsc_senha_hash VARCHAR(255) NOT NULL,
          flg_admin BOOLEAN DEFAULT FALSE,
          vlr_status_conta VARCHAR(20) DEFAULT 'ativo',
          dt_aceite_termos TIMESTAMP,
          dt_criacao_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 1.1 Recuperação de Senha (Time-Safe Migration)
        DROP TABLE IF EXISTS trusted.tb_recuperacao_senha;
        CREATE TABLE trusted.tb_recuperacao_senha (
          id_pedido SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dsc_token VARCHAR(255) NOT NULL,
          dt_expiracao TIMESTAMPTZ NOT NULL,
          flg_usado BOOLEAN DEFAULT FALSE,
          dt_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_recuperacao_token ON trusted.tb_recuperacao_senha(dsc_token);
      `);

      // 2. Perfil de Membro
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted.tb_membros_perfil (
          id_perfil SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario) UNIQUE,
          dsc_nome_completo VARCHAR(255),
          num_xp INTEGER DEFAULT 0,
          num_score_geral FLOAT,
          dsc_perfil_estilo VARCHAR(50),
          flg_badge_diagnostico BOOLEAN DEFAULT FALSE,
          flg_diagnostico_concluido BOOLEAN DEFAULT FALSE,
          flg_perfil_concluido BOOLEAN DEFAULT FALSE,
          dsc_foto_perfil TEXT,
          dt_nascimento DATE,
          vlr_lateralidade TEXT DEFAULT 'Destro',
          dsc_empunhadura TEXT DEFAULT 'Clássica',
          num_altura_cm INTEGER,
          num_peso_kg INTEGER,
          num_telefone VARCHAR(20),
          dsc_nivel_tecnico VARCHAR(50),
          dsc_objetivo TEXT,
          dsc_metas TEXT,
          dsc_mensagem_mentor TEXT,
          num_skill_forehand INTEGER DEFAULT 50,
          num_skill_backhand INTEGER DEFAULT 50,
          num_skill_cozinhada INTEGER DEFAULT 50,
          num_skill_topspin INTEGER DEFAULT 50,
          num_skill_bloqueio INTEGER DEFAULT 50,
          num_skill_saque INTEGER DEFAULT 50,
          num_skill_rally INTEGER DEFAULT 50,
          num_skill_ataque INTEGER DEFAULT 50,
          num_skill_defesa INTEGER DEFAULT 50,
          num_skill_controle INTEGER DEFAULT 50,
          num_skill_movimentacao INTEGER DEFAULT 50,
          dt_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Badges
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted.tb_badges_definicao (
          id_badge VARCHAR(50) PRIMARY KEY,
          dsc_titulo VARCHAR(100),
          dsc_descricao TEXT,
          dsc_icone VARCHAR(50)
        );

        CREATE TABLE IF NOT EXISTS trusted.tb_usuarios_badges (
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          id_badge VARCHAR(50) REFERENCES trusted.tb_badges_definicao(id_badge),
          dt_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id_usuario, id_badge)
        );
      `);

      for (const b of BADGE_TEMPLATES) {
        await pool.query(`
          INSERT INTO trusted.tb_badges_definicao (id_badge, dsc_titulo, dsc_descricao, dsc_icone)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_badge) DO UPDATE SET
            dsc_titulo = EXCLUDED.dsc_titulo,
            dsc_descricao = EXCLUDED.dsc_descricao,
            dsc_icone = EXCLUDED.dsc_icone
        `, [b.id, b.title, b.desc, b.icon]);
      }

      // 4. Diagnósticos e Missões
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted.tb_diagnostico_historico (
          id_diagnostico SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dt_referencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          jsn_respostas JSONB,
          num_score_geral FLOAT,
          dsc_perfil_estilo TEXT,
          num_skill_forehand INTEGER, num_skill_backhand INTEGER, num_skill_saque INTEGER,
          num_skill_consistency INTEGER, num_skill_ataque INTEGER, num_skill_defesa INTEGER,
          num_skill_controle INTEGER, num_skill_movimentacao INTEGER,
          num_skill_cozinhada INTEGER DEFAULT 50, num_skill_topspin INTEGER DEFAULT 50,
          num_skill_bloqueio INTEGER DEFAULT 50
        );

        CREATE TABLE IF NOT EXISTS trusted.tb_missoes_usuario (
          id_missao SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dsc_titulo VARCHAR(255),
          dsc_descricao TEXT,
          dsc_categoria VARCHAR(50),
          num_xp_recompensa INTEGER,
          flg_concluida BOOLEAN DEFAULT FALSE,
          dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          dt_limite TIMESTAMP,
          dt_conclusao TIMESTAMP,
          dsc_tag_tecnica VARCHAR(50)
        );

        CREATE TABLE IF NOT EXISTS trusted.tb_historico_maestria (
          id_historico SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
          dsc_categoria VARCHAR(100),
          dsc_titulo VARCHAR(255),
          num_xp INTEGER,
          dt_conclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          dsc_tag_tecnica VARCHAR(50)
        );
      `);

      // 5. Check-ins, Auditoria e Torneios
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted.tb_checkins (
            id_checkin SERIAL PRIMARY KEY,
            id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
            dt_checkin TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        -- [BOLT:FLUSH] Resetando tabela de logs brutos para sincronizar esquema (Não destrutivo para dados de negócio)
        DROP TABLE IF EXISTS raw.tb_perfil_atualizacoes;

        CREATE TABLE IF NOT EXISTS raw.tb_perfil_atualizacoes (
            id_log SERIAL PRIMARY KEY,
            id_usuario INTEGER,
            jsn_payload_antigo JSONB,
            jsn_payload_novo JSONB,
            dt_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS trusted.tb_analista_torneio_partidas (
            id_partida SERIAL PRIMARY KEY,
            id_torneio INTEGER, 
            id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
            id_oponente INTEGER,
            player_score INTEGER DEFAULT 0,
            opponent_score INTEGER DEFAULT 0,
            sets_won INTEGER DEFAULT 0,
            sets_lost INTEGER DEFAULT 0,
            dt_inicio TIMESTAMP,
            dt_fim TIMESTAMP,
            jsn_pontos_detalhado JSONB,
            dt_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS trusted.tb_analise_cache (
            id_analise SERIAL PRIMARY KEY,
            id_usuario INTEGER REFERENCES trusted.tb_usuarios(id_usuario),
            dsc_hash_input VARCHAR(32),
            dt_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            num_confianca TEXT,
            jsn_resultado JSONB,
            UNIQUE(id_usuario, dsc_hash_input)
        );

        -- TABELA DE VÍDEOS (BOLT Protocol)
        CREATE TABLE IF NOT EXISTS trusted.tb_videos (
            id_video SERIAL PRIMARY KEY,
            dsc_titulo VARCHAR(255) NOT NULL,
            dsc_video_url TEXT NOT NULL,
            dsc_thumb_url TEXT,
            dt_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

        // 6. Governança e Controle de ETL
        await pool.query(`
          CREATE TABLE IF NOT EXISTS governance.etl_control (
            job_name VARCHAR(100) PRIMARY KEY,
            last_run TIMESTAMP,
            status VARCHAR(20),
            rows_processed INTEGER DEFAULT 0,
            dsc_error_msg TEXT
          );

          CREATE TABLE IF NOT EXISTS governance.data_quality_logs (
            id_log SERIAL PRIMARY KEY,
            table_name VARCHAR(100),
            check_type VARCHAR(50),
            status BOOLEAN,
            num_invalid_rows INTEGER,
            dt_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 7. Tabelas de Ingestão RAW (Imutáveis)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS raw.tb_torneio_matches_raw (
            id_ingestion SERIAL PRIMARY KEY,
            id_torneio INTEGER,
            jsn_payload JSONB,
            dt_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            flg_processado BOOLEAN DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS raw.tb_checkins_raw (
            id_ingestion SERIAL PRIMARY KEY,
            id_usuario INTEGER,
            dt_checkin_original TIMESTAMP,
            jsn_metadata JSONB,
            dt_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            flg_processado BOOLEAN DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS raw.tb_onboarding_submissions (
            id_submissao SERIAL PRIMARY KEY,
            jsn_payload JSONB,
            dt_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

      console.log('[DB] Migrations finished successfully!');
    } catch (err) {
      console.error('[DB] Migration error:', err);
    }
};

module.exports = { runMigrations };
