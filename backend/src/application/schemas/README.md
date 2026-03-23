# 📜 Schemas e Contratos

> **Objetivo**: Garantir a integridade estrutural dos dados que entram no sistema, prevenindo "Data Drift" nas camadas Medallion.

## 🔗 Mapeamento Técnico
-   **MatchSchema.js**: Contrato obrigatório para dados de partidas de torneio.

## 🧬 Linhagem e Fluxo
-   **Entrada**: JSON Raw vindo de Requests externos.
-   **Processamento**: Validação de campos obrigatórios e tipos de dados.
-   **Saída**: Booleano ou Exceção (Schema Validation Error).
