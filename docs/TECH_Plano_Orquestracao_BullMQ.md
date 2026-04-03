# 🚀 Plano de Implementação: Orquestração de Elite com BullMQ

> **Objetivo**: Substituir gatilhos manuais e cron-jobs simples por um sistema de mensageria Robusto, Escalável e com Retentativas Automáticas, integrado à governança Medallion.

## 🧭 Fase 1: Discovery (Mapeamento)

- **Categoria**: Nova Construção (Infraestrutura) + Refatoração (Orquestração).
- **Impacto**: Centraliza a execução de processos de longa duração (ETL, IA, Reports) em uma fila gerenciada.

---

## 🛠️ Mudanças Propostas

### 💾 Infraestrutura & Dependências
- **[NEW] [Redis]**: Necessário para o BullMQ persistir o estado das filas. No Easypanel, adicionaremos um serviço de Redis.
- **[MODIFY] [package.json](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/package.json)**: Adicionar `bullmq` e `ioredis`.

### ⚙️ Backend (Service Layer)

#### [NEW] [QueueManager.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/infrastructure/queue/QueueManager.js)
- Singleton para gerenciar conexões Redis.
- Método `addJob(queueName, data)` simplificado.

#### [NEW] [QueueWorker.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/infrastructure/queue/QueueWorker.js)
- Orquestrador de Workers.
- Mapeia nomes de jobs para os Use Cases reais (ex: `ETL_MATCHES` -> `ETLEngine.processMatches`).
- **Integração**: Reporta automaticamente para o [ProcessMonitor.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/services/governance/ProcessMonitor.js) em eventos de `onCompleted` e `onFailed`.

#### [MODIFY] [ETLEngine.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/services/data/transformation/ETLEngine.js)
- Ajustar para ser compatível com a estrutura de execução do BullMQ (receber `job` como contexto).

---

## 🛡️ Governança & Documentação
- **[MODIFY] [backend/src/services/governance/README.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/services/governance/README.md)**: Incluir BullMQ como motor de orquestração.
- **[NEW] [backend/src/infrastructure/README.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/infrastructure/README.md)**: Documentar a camada de mensageria.

---

## 🔬 Plano de Validação
1. **Teste de Enfileiramento**: Adicionar um job de teste e verificar se ele aparece no Redis.
2. **Teste de Execução**: Verificar se o `QueueWorker` dispara o ETL corretamente.
3. **Teste de Monitoramento**: Confirmar se o Dashboard de Monitoramento AI reflete o progresso do BullMQ em tempo real.
4. **Teste de Retentativa**: Simular uma falha e confirmar se o BullMQ tenta rodar novamente conforme configurado.

---
**Entendimento**: Implementar o orquestrador BullMQ mantendo a fidelidade ao Protocolo de Construção Antigravity. 🛰️🚀
