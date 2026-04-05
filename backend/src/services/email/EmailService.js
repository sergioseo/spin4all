const { Resend } = require('resend');

/**
 * SPIN4ALL: Email Service (BOLT Protocol) 🛡️📧
 * Motor de e-mail alimentado pelo Resend para alta performance e entrega.
 */
class EmailService {
    constructor() {
        // Inicializa o Resend com a chave de API (Configurável via .env)
        // Se a chave não existir, o serviço funcionará em modo "Log Only" para desenvolvimento seco.
        this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        
        if (!this.resend) {
            console.warn('⚠️ [EMAIL:CONFIG] RESEND_API_KEY não encontrada. E-mails serão apenas logados no console.');
        }
    }

    /**
     * Envia e-mail de recuperação de senha
     */
    async sendPasswordReset(email, token) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3456'}/reset-password.html?token=${token}`;
        const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Resend.dev é para testes sem domínio verificado

        const emailPayload = {
            from: `Portal Spin4All <${fromAddress}>`,
            to: email,
            subject: 'Recuperação de Senha - Spin4All 🛡️',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #fff; margin: 0;">Spin4All</h1>
                    </div>
                    <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                        <h2>Recuperação de Senha</h2>
                        <p>Olá,</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta no portal Spin4All.</p>
                        <p>Para continuar, clique no botão abaixo:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Redefinir Minha Senha</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Este link expirará em 1 hora por segurança.</p>
                        <p style="color: #666; font-size: 14px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999;">Equipe Spin4All - Tecnologia e Esporte</p>
                    </div>
                </div>
            `
        };

        try {
            if (this.resend) {
                const { data, error } = await this.resend.emails.send(emailPayload);
                
                if (error) {
                    console.error('[EMAIL:RESEND_ERR]', error);
                    throw new Error(error.message);
                }

                console.log(`[EMAIL] Sucesso! ID: ${data.id} enviado para ${email}`);
                return data;
            } else {
                // Modo Simulação (Log Only)
                console.log('--- [SIMULAÇÃO DE E-MAIL] ---');
                console.log('PARA:', email);
                console.log('LINK:', resetLink);
                console.log('----------------------------');
                return { id: 'simulated_id' };
            }
        } catch (err) {
            console.error('[EMAIL:ERR] Falha ao enviar via Resend:', err.message);
            throw new Error('Não foi possível enviar o e-mail. Verifique a configuração do Resend.');
        }
    }
}

module.exports = new EmailService();
