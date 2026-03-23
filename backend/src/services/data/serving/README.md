# 📊 Entrega de Dados (REFINED/SERVING Layer)

> **Objetivo**: Prover acesso otimizado e performático aos dados processados para consumo direto pela UI e dashboards.

## 🔗 Mapeamento Técnico
-   **DashboardServingService.js**: Centralizador de queries otimizadas para o portal.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Queries solicitadas pelos Controladores.
-   **Processamento**: Agregação de dados do schema `trusted` e `refined`.
-   **Saída**: JSON estruturado pronto para renderização no Frontend.
