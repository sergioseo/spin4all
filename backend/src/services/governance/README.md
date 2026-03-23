# 🛡️ Governança e Observabilidade

> **Objetivo**: Monitorar a saúde do sistema, rastrear processos de orquestração e garantir a auditoria do pipeline Medallion.

## 🔗 Mapeamento Técnico
-   **ProcessMonitor.js**: Utilitário core para telemetria de processos (ETL, AI, etc).
- **monitoring.controller.js**: API de telemetria para o Dashboard administrativo.

## 🧬 Linhagem e Fluxo
1. **Origem**: Inserções em `governance.process_logs` por diversos serviços.
2. **Transformação**: Agregações de status (Today, Total, Sucesso).
3. **Consumo**: Dashboard de Monitoramento (Frontend).
