# Evidência Real: Dados do Analista no Banco de Dados

Este documento apresenta o extrato direto das tabelas do Postgres, comprovando que o Motor do Analista está operando com dados reais do seu perfil.

## 1. Tabela: `trusted.tb_analista_torneio_partidas`
*Registros das suas últimas 5 partidas de torneio.*

| ID Partida | Torneio | Score (Você) | Score (Oponente) | Sets Pro | Sets Contra | Data Início |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 11 | 202 | 7 | 11 | 2 | 3 | 2024-03-21 |
| 10 | 202 | 8 | 11 | 2 | 3 | 2024-03-21 |
| 9 | 202 | 11 | 9 | 3 | 2 | 2024-03-21 |
| 8 | 201 | 11 | 2 | 3 | 0 | 2024-03-21 |
| 7 | 201 | 11 | 4 | 3 | 0 | 2024-03-21 |

> [!NOTE]
> Observe que o motor calculou um **WinRate de 60%** (3 vitórias e 2 derrotas) baseado nestes 5 jogos acima.

## 2. Tabela: `trusted.tb_analise_cache`
*Último insight gerado e salvo para o seu usuário.*

*   **ID Análise**: 16
*   **ID Usuário**: 1 (Sérgio)
*   **Confiança**: **ALTA** (Baseada no volume de jogos acima)
*   **Data do Cálculo**: 21/03/2026

### Conteúdo Real da Narrativa (JSON Fragment):
```json
{
  "narrative": {
    "headline": "Decisivo Sob Pressão",
    "explicacao": "Sua performance de 60% e saldo de 0.8 pontos revela um cenário onde você vence nos detalhes finais de forma cirúrgica...",
    "foco": "Manutenção técnica de base e controle de mesa.",
    "acao": "1. Priorize drills de movimentação lateral intensos (Falkenberg) no início do treino... 2. Revise sua estratégia de tempo entre pontos em jogos longos."
  }
}
```

## 2. Tabelas Auxiliares (Motor de Inteligência)

### 2.1. Tabela: `trusted.tb_membros_perfil` (Skills Reais)
*Este é o seu Raio-X técnico que alimenta os cálculos do analista.*

| Usuário | Nível | Forehand | Backhand | Saque | Rally | Ataque | Defesa |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sergio Seo** | **Avançado** | 100 | 100 | 100 | 100 | 100 | 85 |

### 2.2. Tabela: `trusted.tb_missoes_usuario` (Missões Injetadas)
*Prova de que o motor está escrevendo no seu mural de metas.*

| Título | Categoria | XP | Concluída | Tag Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Controle de Ataque** | Analista | 50 | *false* | Ataque |
| **Resistência Técnica** | Analista | 40 | *false* | Stamina |

### 2.3. Tabela: `trusted.tb_historico_maestria` (Histórico de Conclusão)
*Para onde vão as missões quando você termina? É o seu registro permanente.*

| ID Histórico | Categoria | Título da Missão | XP | Data Conclusão | Tag Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Analista** | **Resistência Técnica** | 50 | 21/03/2026 | Ataque |

### 2.4. Tabela: `trusted.tb_checkins` (Frequência)
*Últimos registros de presença que validam sua constância.*

| Data do Check-in |
| :--- |
| 21/03/2026 |
| 19/03/2026 |
| 16/03/2026 |
| 13/03/2026 |
| 11/03/2026 |

## 3. Conclusão da Auditoria de Dados
Os dados acima, extraídos em tempo real, provam que:
1.  O motor **lê** as partidas reais do banco.
2.  O motor **lê** suas habilidades técnicas (100% de maestria em quase tudo).
3.  O motor **propaga** recomendações (Ataque/Stamina) para a tabela de missões.
4.  O sistema de **Frequência** está alimentado pelos check-ins reais do período.
