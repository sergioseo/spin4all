# Parâmetros de Construção de Metas (Engine Analista)

Este documento detalha as regras de negócio utilizadas pelo motor para "escrever" novas missões no seu mural. O sistema prioriza comportamento sobre cenários estáticos.

## 1. Regras de Prioridade (Hierarchy)

O motor segue esta ordem de decisão para escolher suas 2 metas semanais:
1.  **Flags de Comportamento**: Se o motor detectar `STAMINA` ou `AGRESSIVO`, estas missões são obrigatórias.
2.  **Cenários Táticos**: Caso não haja flags, o motor usa o ID do Cenário (`T1` a `T6`) para sugerir treinos de equilíbrio.

## 2. Mapeamento de Flags -> Missões

| Flag Detectada | Título da Missão | Treino Recomendado | XP | Tag Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **STAMINA** | Resistência Técnica | 5 min de Falkenberg Drill (movimentação intensiva) | 40 | Stamina |
| **AGRESSIVO** | Controle de Ataque | Saque curto + ataque de 3ª bola (10 repetições) | 50 | Ataque |

## 3. Mapeamento de Cenários (Fallback) -> Missões

Se você não tiver disparado nenhum alerta de comportamento, o sistema olha para o seu momento competitivo:

| Cenário | Título da Missão | Foco do Treino | XP | Tag Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **T3 (Oscilação)** | Foco em Transição | Transição FH/BH em série de 3 min | 30 | Transição |
| **T1 (Dominante)** | Consistência de Elite | 50 bolas seguidas com parceiro superior | 60 | Consistência |
| **Outros** | Fundamento Base | 15 min de controle de mesa (blocking/pushing) | 20 | Básico |

## 4. Metadados do Sistema

*   **Prazos (Deadline)**: Toda missão do analista nasce com um prazo de **3 dias** para conclusão (`CURRENT_DATE + 3`).
*   **Limitação**: O sistema limpa missões anteriores do analista não concluídas antes de injetar as novas, evitando poluição visual.
*   **Quantidade**: Máximo de **2 missões** por rodada de análise.

## 5. Filtro de Dificuldade (Tiering)

Além da análise de partidas, o motor cruza estes dados com o seu **Nível Técnico**:
*   **Iniciante (Tier 1)**: Filtra missões básicas do template.
*   **Intermediário (Tier 2)**: Libera drills de transição e efeito.
*   **Avançado (Tier 3)**: Libera contra-topspin e Falkenberg avançado.

> [!TIP]
> No seu caso atual (**Avançado/Tier 3**), o sistema liberou a missão de **Falkenberg Drill** (Resistência Técnica) porque é condizente com o seu nível de jogo.
