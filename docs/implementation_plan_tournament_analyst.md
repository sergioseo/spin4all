# Plano Mestre: Analista Pessoal (Coach Digital) 🎾🧠

Este documento consolida a arquitetura, lógica e estratégia de UX para o Analista Pessoal de Torneios, visando um sistema 10/10: **Adaptativo, Confiável e Econômico.**

## 1. Arquitetura de Produção (Pipeline Decoplado)

Para garantir que o sistema seja rápido, barato em tokens e tecnicamente preciso (sem alucinações matemáticas), o processamento seguirá 4 fases:

- **FASE 0: Sanitização de Dados (Backend/SQL):**
  - Remover duplicatas de partidas.
  - Bloquear scores impossíveis (ex: sets > 3 ganhos em MD5).
  - Validar integridade temporal (Filtro Dinâmico: min 1 min/set, max 20 min/set).

- **FASE 1: Motor de Cálculo Puro (Backend/SQL):**
  - Calcular Win Rate, Diferença Média de Pontos, Variância e Percentis.
  - Extrair **Deltas de Evolução** (comparação com últimos 30 dias/último torneio).
  - Determinar **Score de Confiança** (Alta ≥ 6 jogos, Média 3-5, Baixa < 3).

- **FASE 2: Orquestrador de Inteligência (Backend/JS):**
  - Classificar o jogador na matriz de cenários ([tournament_analyst_scenarios.md](file:///C:/Users/sjwse/.gemini/antigravity\brain\e04c4d2a-e9ab-4e52-8a4d-8b66a7674df3\tournament_analyst_scenarios.md)).
  - Aplicar Pesos de Impacto (Cenário 50% / Evolução 30% / Tempo 20%).
  - Resolver conflitos (Histerese) e aplicar o **Modo Iniciante Protegido**.

- **FASE 3: Geração de Narrativa (LLM & Cache):**
  - Enviar JSON compacto para OpenAI (GPT-4o mini).
  - O LLM gera a narrativa fixa: **Headline -> Explicação -> Ajuste -> Ação.**
  - **Estratégia de Cache:** Salvar o insight no banco de dados (`tb_analise_cache`). O Dashboard lê o cache instantaneamente (custo zero de tokens na visualização repetida).

## 2. Experiência do Usuário (UI/UX)

O Card do Analista no Dashboard refletirá este " Coach Digital":

- **Headline de Impacto:** Frase curta que resume o estado atual ("Você compete bem, mas perde nos detalhes").
- **Deltas Visuais:** Pílulas coloridas mostrando a evolução (ex: 🟢 +12% Win Rate).
- **Chamada para Ação (CTA):** Botão direto para a Missão Recomendada pelo Analista.
- **Sincronização:** O Mural de Missões e Conquistas será filtrado/iluminado conforme a orientação do Analista.

## 3. Estratégia Financeira (Tokens)
Com o uso do **GPT-4o mini** e a arquitetura de **Cache**, o custo para 100 jogadores ativos será de aproximadamente **$0.01 por rodada de análise**, tornando o sistema extremamente escalável dentro do orçamento de $5.

## 4. Próximos Passos (Hands-on)
1.  Criação da tabela de cache e migração de sanitização.
2.  Implementação do Motor de Cálculo em [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/server.js).
3.  Configuração da integração OpenAI com prompt de Persona de Coach.
4.  Renderização do Card Dinâmico no Frontend.
