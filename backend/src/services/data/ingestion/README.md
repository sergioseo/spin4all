# 📥 Ingestão de Dados (RAW Layer)

> **Objetivo**: Ponto de entrada único e obrigatório para todos os dados que chegam ao sistema.

## 🔗 Mapeamento Técnico
-   **DataIngestor.js**: Único serviço autorizado a escrever no schema `raw`.
    -   **Idempotência**: Garante que duplicatas não poluem o RAW.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Request Data (External).
-   **Processamento**: Schema Validation -> Raw Persistence.
-   **Saída**: ID do registro RAW.
