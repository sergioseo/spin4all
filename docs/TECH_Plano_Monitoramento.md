# 📊 Plano: Dashboard de Orquestração e Monitoramento

Este plano visa dar visibilidade total aos processos de "bastidor" do Spin4all (ETL Medallion, AI Pipeline e Ingestão), permitindo que o administrador acompanhe a saúde do sistema em tempo real.

## 🎯 Objetivos
-   **Transparência**: Ver o status (Working, Success, Fail) de cada job.
-   **Observabilidade**: Logs detalhados de erros para depuração rápida.
-   **UX Premium**: Interface de monitoramento moderna com barras de progresso e indicadores de saúde.

---

## 🛠️ Fase 10: Telemetria e API (Backend)
1.  **Infraestrutura de Logs**:
    *   [ ] Criar tabela `governance.process_logs` para rastreamento granular (step-by-step).
    *   [ ] Implementar utilitário `ProcessMonitor.js` para registrar inícios, progressos e fins de tarefas.
2.  **Instrumentação**:
    *   [ ] Integrar `ProcessMonitor` no [ETLEngine.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/services/data/ETLEngine.js).
    *   [ ] Integrar `ProcessMonitor` no [AnalyzeTournamentMatches.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/application/use-cases/AnalyzeTournamentMatches.js).
3.  **API de Monitoramento**:
    *   [ ] Criar `backend/src/controllers/admin/monitoring.controller.js`.
    *   [ ] Criar rota `GET /api/admin/monitoring/status`.

## 🎨 Fase 11: Dashboard de Controle (Frontend)
1.  **Interface Glassmorphism**:
    *   [ ] Criar `frontend/admin/monitoring.html`.
    *   [ ] Implementar Cards de Status (Total Jobs, Success Rate, Active Processes).
    *   [ ] Criar Lista de Processos com barras de progresso dinâmicas.
2.  **Interatividade**:
    *   [ ] Implementar sistema de polling (atualização a cada 5s) para simular real-time.
    *   [ ] Adicionar filtros por tipo de processo (ETL vs AI).

---

## 📐 Design de Referência
Utilizaremos um design focado em **Dark Mode + Vibrant Accents** (Verde para Success, Vermelho para Fail, Azul para Working), mantendo a estética Glassmorphism do projeto.
