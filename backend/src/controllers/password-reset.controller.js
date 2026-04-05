const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const EmailService = require('../services/email/EmailService');

/**
 * SPIN4ALL: Password Reset Controller (BOLT Protocol) 🛡️⚡
 * Gerencia a lógica de redefinição de segurança.
 */
class PasswordResetController {
    
    /**
     * Gera o pedido de recuperação
     */
    async forgotPassword(req, res) {
        const { email } = req.body;
        
        try {
            // 1. Verificar se o e-mail existe
            const userRes = await pool.query('SELECT id_usuario FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
            
            if (userRes.rows.length === 0) {
                // [BOLT:SECURITY] Log para auditoria interna
                console.log(`[AUTH] 🛡️ Solicitação de recuperação ignorada: E-mail não cadastrado (${email})`);
                
                // Por segurança, não informamos que o e-mail não existe (prevenção de enumeração)
                return res.json({ success: true, message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.' });
            }

            const userId = userRes.rows[0].id_usuario;

            // 2. Gerar Token Seguro (Expiração de 1 hora gerenciada pelo DB)
            const token = crypto.randomBytes(32).toString('hex');

            // 3. Salvar no Banco (Usando INTERVAL para garantir precisão de fuso horário)
            await pool.query(
                'INSERT INTO trusted.tb_recuperacao_senha (id_usuario, dsc_token, dt_expiracao) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'1 hour\')',
                [userId, token]
            );

            // 4. Enviar E-mail (Sem travar a resposta)
            EmailService.sendPasswordReset(email, token).catch(err => {
                console.error('[RESET:ERR] Falha ao enviar e-mail:', err.message);
            });

            res.json({ success: true, message: 'Link de recuperação enviado com sucesso!' });
        } catch (err) {
            console.error('[RESET:ERR] Erro no forgotPassword:', err.message);
            res.status(500).json({ success: false, message: 'Erro interno ao processar recuperação.' });
        }
    }

    /**
     * Valida e redefine a senha
     */
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;

        try {
            // 1. Validar estado do token
            const diagnosticRes = await pool.query(
                `SELECT rs.id_pedido, rs.id_usuario, rs.dt_expiracao, rs.flg_usado, 
                (rs.dt_expiracao < CURRENT_TIMESTAMP) as "is_expired"
                 FROM trusted.tb_recuperacao_senha rs
                 WHERE rs.dsc_token = $1`,
                [token]
            );

            if (diagnosticRes.rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Link de recuperação inválido.' });
            }

            const tokenData = diagnosticRes.rows[0];

            if (tokenData.flg_usado) {
                return res.status(400).json({ success: false, message: 'Este link de recuperação já foi utilizado.' });
            }

            if (tokenData.is_expired) {
                return res.status(400).json({ success: false, message: 'Este link de recuperação expirou. Solicite um novo.' });
            }

            const { id_pedido, id_usuario } = tokenData;

            // 2. Hash da nova senha
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 3. Transação Atômica: Atualizar usuário e marcar token como usado
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Atualizar senha
                await client.query(
                    'UPDATE trusted.tb_usuarios SET dsc_senha_hash = $1 WHERE id_usuario = $2',
                    [hashedPassword, id_usuario]
                );

                // Marcar token como usado
                await client.query(
                    'UPDATE trusted.tb_recuperacao_senha SET flg_usado = TRUE WHERE id_pedido = $1',
                    [id_pedido]
                );

                await client.query('COMMIT');
                res.json({ success: true, message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
            } catch (innerErr) {
                await client.query('ROLLBACK');
                throw innerErr;
            } finally {
                client.release();
            }

        } catch (err) {
            console.error('[RESET:ERR] Erro no resetPassword:', err.message);
            res.status(500).json({ success: false, message: 'Erro ao redefinir senha.' });
        }
    }
}

module.exports = new PasswordResetController();
