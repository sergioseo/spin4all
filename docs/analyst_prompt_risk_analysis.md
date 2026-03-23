# Análise de Risco: System Prompt do Analista (v0.1 vs v2.0)

A análise que você recebeu é excelente e toca em feridas reais da engenharia de IA. Abaixo, avalio cada ponto comparando com o que **realmente temos hoje no seu código**.

---

### 1. Falta de Contrato de Saída (Schema)
*   **O que temos:** Já usamos `response_format: { type: 'json_object' }` e pedimos as 4 chaves (headline, explicacao, foco, acao).
*   **Risco Real:** **MÉDIO.** O JSON não quebra, mas a IA pode escrever um parágrafo enorme dentro de "explicacao".
*   **Solução v2.0:** Definir limites de caracteres por chave e um exemplo de output "Ideal".

### 2. Não obriga uso dos Dados
*   **O que temos:** Passamos as variáveis `${metrics.win_rate}` e `${metrics.avg_point_diff}`, mas o prompt apenas "pede" para usar.
*   **Risco Real:** **ALTO.** A IA pode dizer "Parabéns, você jogou bem" sem citar que o WinRate foi de 40%.
*   **Solução v2.0:** Mandato explícito: *"Sua análise DEVE iniciar citando o dado numérico mais relevante"*.

### 3. Ambiguidade na "Explicação"
*   **O que temos:** "Seja direto" é o comando atual.
*   **Risco Real:** **MÉDIO.** Gera inconsistência no tom de voz (ora muito seco, ora muito amigável).
*   **Solução v2.0:** Definir o tom de voz como **"Analítico de Alta Performance"** (Estilo jornalismo técnico ou laudo médico esportivo).

### 4. Ação Aberta Demais (O Risco mais Crítico!)
*   **O que temos:** Hoje a IA não conhece nossa lista de 15+ (ou 30) templates. Ela "inventa" uma sugestão no texto, enquanto o código injeta a missão real no mural. 
*   **Risco Real:** **CRÍTICO.** A IA pode sugerir "Treino de Saque" no texto, mas o motor injetar "Falkenberg" na meta. Isso gera desconfiança no usuário.
*   **Solução v2.0:** **Injeção de Contexto.** Vamos passar a lista de missões disponíveis para a IA, para que ela recomende EXATAMENTE o que o sistema vai injetar no mural.

### 5. Prioridade de Análise
*   **O que temos:** Passamos Cenário e Flags misturados.
*   **Risco Real:** **ALTO.** A IA pode focar no "Cenário" (geral) e ignorar uma "Flag" (alerta técnico urgente como Stamina).
*   **Solução v2.0:** Hierarquia de Prompt: *"Priorize Flags sobre Cenários. Se houver Flag STAMINA, ela deve ser o centro da explicação"*.

---

## Proposta: System Prompt v2.0 (O "Novo Cérebro")

Abaixo, o prompt refatorado que soluciona os 5 riscos acima:

```text
Você é o Diretor Técnico da Spin4All. Seu objetivo é analisar dados técnicos de competições de Tênis de Mesa com rigor estatístico.

[SCHEMA]
Responda EXATAMENTE em JSON:
{
  "headline": "Título curto (máx 30 chars)",
  "explicacao": "Análise técnica (60-100 chars). Inicie OBRIGATORIAMENTE citando o dado (WR ou Diff).",
  "foco": "Qual o pilar mais crítico no momento (Técnico, Físico ou Tático).",
  "acao": "Indique EXATAMENTE qual das metras disponíveis o aluno deve seguir."
}

[HIERARQUIA DE DADOS]
1. FLAGS (Alertas Críticos): Se houver 'STAMINA' ou 'AGRESSIVO', ignore o cenário geral e foque no ALERTA.
2. MÉTRICAS: WinRate (WR) e Point Diff (Diff).
3. CENÁRIO: Use apenas como contexto de fundo.

[RESTRIÇÃO DE CONHECIMENTO]
Você só pode sugerir ações baseadas nestes templates reais:
- Técnica: Precisão FH, Backhand Punch, Topspin FH, Contra-Topspin.
- Física: Falkenberg, Passo Cruzado, Agilidade.
- Tática: Saque Variado, 3ª Bola, Plano Tático.

NUNCA use termos como "você está indo bem" ou "quase lá". Use: "Performance oscilante", "Defasagem técnica detectada", "Consistência acima da média".
```

---

**Veredito:** O que temos hoje é um "MVP de IA". Ele funciona, mas tem as vulnerabilidades citadas. Se aplicarmos essa v2.0, eliminamos a chance do agente "alucinar" conselhos genéricos e blindamos o parsing do JSON. 

QUER QUE EU IMPLEMENTE ESSA v2.0 AGORA?
