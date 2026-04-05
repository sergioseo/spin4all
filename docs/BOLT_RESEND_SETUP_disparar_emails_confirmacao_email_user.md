# Configuração do Resend para o Domínio @spin4all.com.br 🛡️📧

Este guia orienta a configuração do **Resend** para garantir que os e-mails transacionais (como recuperação de senha) cheguem com 100% de confiabilidade aos seus usuários.

## 1. Criação da Conta
1. Acesse [https://resend.com](https://resend.com) e crie sua conta (Grátis).
2. Verifique o seu e-mail pessoal para ativar a conta.

---

## 2. Configuração do Domínio (O PASSO MAIS IMPORTANTE)
Para enviar e-mails como `suporte@spin4all.com.br`, você precisa provar ao Resend que é o dono do domínio.

1. No painel do Resend, vá em **Domains** -> **Add Domain**.
2. Digite: `spin4all.com.br`.
3. O Resend vai gerar uma lista de registros DNS (geralmente do tipo **MX**, **SPF** e **DKIM**).
4. Você deve entrar no painel onde registrou o seu domínio (Ex: Registro.br, Hostgator, etc.) e adicionar esses registros exatamente como o Resend solicita.
5. Após adicionar, clique em **Verify** no painel do Resend. (Pode levar alguns minutos para propagar).

---

## 3. Geração da API Key
1. No painel lateral, vá em **API Keys**.
2. Clique em **Create API Key**.
3. Nomeie como: `Spin4All - Website`.
4. Deixe a permissão como `Full Access`.
5. **COPIE A CHAVE** (começa com `re_...`). Você não poderá vê-la novamente.

---

## 4. Integração no Portal
Agora, abra o seu arquivo `.env` na pasta `backend` e adicione as seguintes variáveis:

```bash
# 🔑 Chave do Resend (Aquela que você copiou no passo 3)
RESEND_API_KEY=re_sua_chave_aqui

# 📧 Remetente Oficial (Mude para um e-mail que faça sentido)
EMAIL_FROM=suporte@spin4all.com.br

# 🌐 URL do site (Para o link de redefinição funcionar)
FRONTEND_URL=https://spin4all.com.br
```

---

## 💡 Dicas de Suporte
- **Limites**: O plano gratuito permite 3.000 envios/mês e 100 envios/dia.
- **Teste de Desenvolvimento**: Enquanto você não configurar o DNS, você pode usar o endereço `onboarding@resend.dev` como o seu `EMAIL_FROM`, mas ele apenas enviará e-mails para o seu próprio endereço pessoal (o que você usou para criar a conta no Resend).

🏆 **Com isso configurado, o Spin4All terá o nível mais alto de segurança e confiabilidade em e-mails!**
