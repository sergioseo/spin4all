# 🎯 Casos de Uso (Use Cases)

> **Objetivo**: Isolar lógicas de negócio complexas que envolvem múltiplos serviços e efeitos colaterais.

## 🔗 Mapeamento Técnico
-   **AnalyzeTournamentMatches.js**: Orquestra Ingestão, Pipeline de IA e Sincronização de Missões.

## 🧬 Linhagem e Fluxo
-   **Entrada**: ID do Usuário e IDs de Contexto.
-   **Processamento**: Busca em Trusted -> Executa AnalysisService -> Atualiza Missões.
-   **Saída**: Objeto estruturado de análise e status de sucesso.
