/**
 * SPIN4ALL - Diagnostic Controller (BOLT Protocol)
 * Gerencia a submissão e persistência do mapeamento técnico de 13 passos.
 */

const pool = require('../config/db');

exports.submitDiagnostic = async (req, res) => {
    const { mapping, answers } = req.body;
    const userId = req.user.id;

    if (!mapping || !answers) {
        return res.status(400).json({ success: false, message: 'Dados do diagnóstico incompletos.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log(`[DIAGNOSTIC] Processando submissão para usuário ID: ${userId}`);

        // 1. ATUALIZAR PERFIL DO MEMBRO (Skills e Status)
        // Mapeamento de Skills: frontend 'consistency' -> backend 'num_skill_rally'
        const updatePerfilQuery = `
            UPDATE trusted.tb_membros_perfil 
            SET 
                num_skill_forehand = $1,
                num_skill_backhand = $2,
                num_skill_saque = $3,
                num_skill_rally = $4,
                num_skill_ataque = $5,
                num_skill_defesa = $6,
                num_skill_controle = $7,
                num_skill_movimentacao = $8,
                num_skill_cozinhada = $9,
                num_skill_topspin = $10,
                num_skill_bloqueio = $11,
                dsc_perfil_estilo = $12,
                dsc_nivel_tecnico = $13,
                flg_perfil_concluido = TRUE,
                dt_atualizacao = CURRENT_TIMESTAMP
            WHERE id_usuario = $14
        `;

        const estilo = answers[11] || 'Equilibrado'; 
        const nivelComp = answers[13] || 'Amador';

        await client.query(updatePerfilQuery, [
            mapping.forehand,
            mapping.backhand,
            mapping.saque,
            mapping.consistency,
            mapping.ataque,
            mapping.defesa,
            mapping.controle,
            mapping.movimentacao,
            mapping.cozinhada,
            mapping.topspin,
            mapping.bloqueio,
            estilo,
            nivelComp,
            userId
        ]);

        // 2. REGISTRAR HISTÓRICO DE DIAGNÓSTICO
        const insertHistoryQuery = `
            INSERT INTO trusted.tb_diagnostico_historico (
                id_usuario, 
                jsn_respostas, 
                dsc_perfil_estilo,
                num_skill_forehand, num_skill_backhand, num_skill_saque,
                num_skill_consistency, num_skill_ataque, num_skill_defesa,
                num_skill_controle, num_skill_movimentacao,
                num_skill_cozinhada, num_skill_topspin, num_skill_bloqueio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        await client.query(insertHistoryQuery, [
            userId,
            JSON.stringify({ mapping, answers }),
            estilo,
            mapping.forehand, mapping.backhand, mapping.saque,
            mapping.consistency, mapping.ataque, mapping.defesa,
            mapping.controle, mapping.movimentacao,
            mapping.cozinhada, mapping.topspin, mapping.bloqueio
        ]);

        await client.query('COMMIT');
        console.log(`[DIAGNOSTIC] Submissão concluída com sucesso para ID: ${userId}`);

        res.json({ 
            success: true, 
            message: 'Diagnóstico processado com sucesso! Suas missões foram atualizadas.' 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[DIAGNOSTIC ERROR]', err);
        res.status(500).json({ success: false, message: 'Erro interno ao processar diagnóstico.' });
    } finally {
        client.release();
    }
};
