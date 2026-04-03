# Prescrição vs Geração: Como o Analista Trabalha

Para responder sua pergunta diretamente: **É um modelo híbrido.** O Analista não "inventa" missões do zero com IA para evitar sugestões tecnicamente incorretas ou perigosas.

## 1. O que é GERADO (IA On-the-fly)
A **Narrativa** (o texto que explica seu desempenho) é gerada pelo agente de IA (`gpt-4o-mini`).
*   **Por que?** Para que o feedback pareça humano, contextualizado e varie de acordo com o seu humor competitivo.
*   **Input da IA**: O motor envia seus números (WinRate, Diff, Flags) e pede: *"Aja como um Diretor Técnico e explique estes dados"*.

## 2. O que é PRESCRITO (Lógica Determinística)
As **Missões** (os cards com XP e título) são selecionadas de uma lista curada de **15+ Templates Técnicos** no [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js).
*   **Por que?** Porque o Tênis de Mesa exige precisão. Uma IA livre poderia sugerir "correr 10km", o que não ajuda sua "Stamina de Mesa". O motor garante que, se você cansar, o treino será **Falkenberg Drill** (treino clássico de movimentação lateral).
*   **Como é gerado?** O motor no [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js) (Linhas 1056-1070) faz o mapeamento:
    *   `Flag: STAMINA` → Injeta ID `f_stamina` do banco.
    *   `Flag: AGRESSIVO` → Injeta ID `f_ataque` do banco.

## 3. O Fluxo de "Geração" no Banco
As missões **não ficam paradas** no banco esperando. Elas são **injetadas dinamicamente** toda vez que o Analista roda:

1.  **Limpeza**: O sistema deleta as missões anteriores do analista que você não completou (para não acumular lixo).
2.  **Mapeamento**: O motor escolhe os IDs de treino que "curam" sua fraqueza detectada.
3.  **Gravação**: Ele escreve na tabela `trusted.tb_missoes_usuario` com um novo ID de instância e uma nova data de expiração.

## 4. Conclusão: Por que não usar IA nas Missões?
Decidimos por esse modelo "Híbrido" para manter o **Portal Spin4All** tecnicamente inquestionável.
*   **IA** cuida da empatia e da análise de dados (Narrativa).
*   **Lógica de Engenharia** cuida da prescrição técnica (Metas).

Isso garante que você sempre tenha um treino real, validado por treinadores, e não uma alucinação de IA.
