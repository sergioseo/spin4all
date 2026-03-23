# ⚙️ Transformação de Dados (TRUSTED Layer)

> **Objetivo**: Processamento industrial de dados RAW para a camada TRUSTED, aplicando regras de negócio e validações de qualidade.

## 🔗 Mapeamento Técnico
-   **ETLEngine.js**: Motor central de processamento assíncrono.
    -   **Observabilidade**: Integrado ao `ProcessMonitor`.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Dados do schema `raw.tb_torneio_matches_raw`.
-   **Processamento**: Limpeza -> Deduplicação -> Validação de Scores.
-   **Saída**: Dados persistidos no schema `trusted.tb_analista_torneio_partidas`.
