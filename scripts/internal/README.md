# 📂 Scripts Internos e Ferramentas de Engenharia

> **Objetivo**: Prover utilitários para manutenção, carga de dados (seeding), testes e execução de pipelines.

## 🔗 Mapeamento Técnico
-   **seed_analista.js**: Popula o banco com dados de partidas de teste seguindo o fluxo RAW-First.
-   **test_logic.js**: Script para validar lógicas isoladas da Engine de Análise.
-   **run_etl_matches.js**: Runner manual para o pipeline de processamento de partidas.
-   **inspect_db.js**: Utilitário para auditoria rápida de schemas e tabelas.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Configurações em `.env` e parâmetros manuais via CLI.
-   **Processamento**: Execução via `node scripts/internal/[script].js`.
-   **Saída**: Alterações de estado no DB, logs no terminal ou relatórios em Markdown.

## ⚙️ Dependências e Impacto
-   **Depende de**: `backend/.env`, `backend/src/config/db.js`.
-   **Impacto**: Crítico para desenvolvimento. Scripts de seed mal configurados podem corromper dados de teste na camada `trusted`.
