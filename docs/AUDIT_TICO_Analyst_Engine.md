# Auditoria Geral: Motor do Analista de Torneios (v12:10)

Esta auditoria detalha a arquitetura, lógica e dados reais do **Analista Pessoal** implementado no Spin4All. O sistema opera em um modelo híbrido (Cálculo Determinístico + IA Generativa) e está totalmente integrado ao banco de dados e ao mural de missões.

## 1. Arquitetura de APIs e Endpoints
O motor é alimentado principalmente por um endpoint central que orquestra a análise:

*   **API Principal**: `GET /api/analysis/tournament-summary`
    *   **Função**: Coleta dados de partidas, sanitiza, calcula métricas, seleciona cenários táticos e gera a narrativa explicativa.
    *   **Arquivo**: [backend/server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js) (Linhas 900-1101)
*   **API de Missões**: `GET /api/missions/current`
    *   **Função**: Exibe as recomendações práticas injetadas pelo analista no portal.
*   **API de Perfil**: `GET /api/user/skills`
    *   **Função**: Fornece dados técnicos (Forehand, Backhand, etc.) caso o usuário ainda não tenha jogado torneios (Fallback).

## 2. Tabelas de Banco de Dados (PostgreSQL)
A inteligência do motor reside no cruzamento das seguintes tabelas:

| Tabela | Função no Motor |
| :--- | :--- |
| `trusted.tb_analista_torneio_partidas` | **Fonte Primária**: Contém sets ganhos/perdidos, scores, tempos e IDs de torneio. |
| `trusted.tb_diagnostico_historico` | **Raio-X Técnico**: Armazena as notas de habilidades (0-100) do diagnóstico inicial. |
| `trusted.tb_analise_cache` | **Performance**: Evita chamadas redundantes de IA se os dados de jogo não mudaram. |
| `trusted.tb_missoes_usuario` | **Braço Operacional**: Onde o analista "escreve" os treinos recomendados como missões. |

## 3. Lógica do Motor (As 4 Fases)

O "Motor" que você criou está aplicado no [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js) seguindo este fluxo rigoroso:

### Fase 0: Sanitização (Filtro de Ruído)
O código valida se as partidas são reais (MD5) e se os tempos fazem sentido.
> Partidas com 0 sets ou durações impossíveis (ex: 1 min para 5 sets) são marcadas como `invalidTime` para não enviesar a análise de stamina.

### Fase 1: Cálculo Determinístico (Matemática Pura)
O motor calcula:
*   **WinRate (WR)**: `%` de vitórias.
*   **Avg Point Diff**: Saldo médio de pontos por partida.
*   **Nível de Confiança**: BAIXA ( < 3 jogos), MÉDIA (3-5), ALTA (6+).

### Fase 2: Orquestrador de Cenários & Flags
Aqui o sistema identifica **Comportamentos**:
*   **Flag `STAMINA`**: Se o WR cai > 20% em jogos longos (> 25min).
*   **Flag `AGRESSIVO`**: Se o volume de pontos por minuto é alto (> 1.5 ppm).
*   **Cenários**: `Dominante (T1)`, `Decisivo (T2)`, `Oscilação (T3)`, `Paredão (T4)`, `Ajuste Fino (T5)`, `Base (T6)`.

### Fase 3: Narrativa IA (OpenAI GPT-4o-mini)
O sistema envia as métricas e o cenário para a IA, que atua como **Diretor Técnico**, gerando chaves JSON: `headline`, `explicacao`, `foco` e `acao`.

## 4. Integração Prática (Exemplo de Fluxo)

> [!IMPORTANT]
> **Cenário Real na Lógica**: Se o motor detecta que você perde partidas longas (Flag `STAMINA`), ele automaticamente:

1.  Gera a narrativa: *"Sua taxa de vitória cai em jogos longos..."*
2.  Injeta no seu Mural de Missões: **"Resistência Técnica: 5 min de Falkenberg Drill"**.
3.  Define a tag técnica como **"Stamina"**.

## 5. Estrutura de Arquivos Envolvidos
*   🚀 **Backend**: [backend/server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js) (O cérebro do analista).
*   🎨 **Frontend (View)**: [frontend/js/modules/home/home.view.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/js/modules/home/home.view.js) (Renderiza o card de 'Meu Momento').
*   ⚙️ **Frontend (Controller)**: [frontend/js/modules/home/home.controller.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/js/modules/home/home.controller.js) (Chama as APIs no [init](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/js/modules/home/home.controller.js#10-78)).

Esta lógica está **ATIVA** e rodando no seu servidor agora. Não há invenções: o código lê seu banco, processa as regras de negócio e entrega a análise no Dashboard.
