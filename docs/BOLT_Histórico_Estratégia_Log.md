# 🛰️ BOLT --- Estratégia de Log & Explicabilidade (v1.1 Consolidada)

Esta documentação formaliza a transição do BOLT para um sistema de **Explicabilidade Operacional**. O objetivo é garantir que cada movimento dos agentes de IA seja rastreável, auditável e defensável.

---

## 🧠 Contexto Estratégico

Tradicionalmente, logs são registros passivos ("O que aconteceu"). No **BOLT**, os logs são narrações ativas ("Por que isso aconteceu"). Em um ecossistema de multi-agentes (PO, Architect, Executor), a causa-raiz de um erro muitas vezes reside em uma **decisão de planejametno** e não em um erro de digitação.

---

## 🧱 Detalhamento das Fases

### FASE 0: A Fundação (Base)
*   **Ação**: Centralização do logger e criação do `ExecutionID`.
*   **Implementação**: Gerado no `main.js` ou `deliberation-controller.js`.
*   **Impacto**: Permite agrupar todas as ações de uma mesma tarefa (do PO ao QA) sob o mesmo código.

### FASE 1: O "Porquê" (Prompt Layer)
*   **Ação**: Obrigatoriedade do campo `decision.reason` em todas as Skills.
*   **Impacto**: A IA pára de apenas entregar código e passa a entregar a **lógica** por trás dele.
*   **Governança**: Publicar o `audit-schema.json` v2 com campos obrigatórios.

### FASE 2: Rastreio de Deliberação (Sync Trace)
*   **Ação**: Registro detalhado dos rounds de discussão entre PO e Architect.
*   **Configuração**: Diretório `/logs/deliberation/` para persistência de rounds.

### FASE 3: Discovery de Legado (Context Trace)
*   **Ação**: Registro do que o Context Scanner encontrou.
*   **ROI**: Demonstra o quanto de esforço foi poupado ao não recriar funções existentes.

### FASE 4: Auto-Diagnóstico de Falha (QA Failure)
*   **Ação**: Diff automático entre Contrato Escolhido vs Código Entregue.
*   **Impacto**: O erro aponta para si mesmo. "Falha: O contrato pedia X, o Executor entregou Y".

---

## 🔄 Plano de Incrementação no BOLT

A integração desta camada de logs no BOLT já construído seguirá os seguintes passos técnicos:

1.  **Instrumentação de Skills**: Atualizaremos os arquivos `system.txt` das skills existentes para exigir a estrutura de output JSON com `decision` e `reason`.
2.  **Controller Injection**: O `deliberation.controller.js` será o herdeiro de todos os logs das rodadas de negociação.
3.  **Audit Hub**: Todas as validações AJV passarão a alimentar o `/logs/governance.log` de forma unificada.

---

## ✅ Checklist de Evolução (Industrial)

- [x] **Instrumentação Base (Fase 0)**: Implementar o `execution_id` e o `logger-bolt.js`. (Concluído ✨)
- [/] **Padronização de Schema (Fase 1)**: Publicar o [audit-schema.json](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/contracts/audit-schema.json) v2.
- [ ] **Deliberação Rastreável (Fase 2)**: Configurar o diretório `/logs/deliberation/`.
- [ ] **Memória de Decisão (Fase 6)**: Criar o repositório `/governance/decisions`.

---
**Nota Editorial**: Este documento foi consolidado a partir das versões `.md` e `no-extension` para garantir a integridade total do histórico de planejamento de explicabilidade.
