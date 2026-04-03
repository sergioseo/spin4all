# 🛰️ BOLT --- Estratégia de Log & Explicabilidade (v1)

Esta documentação formaliza a transição do BOLT para um sistema de **Explicabilidade Operacional**. O objetivo é garantir que cada movimento dos agentes de IA seja rastreável, auditável e defensável.

---

## 🧠 Contexto Estratégico

Tradicionalmente, logs são registros passivos ("O que aconteceu"). No **BOLT**, os logs são narrações ativas ("Por que isso aconteceu"). Em um ecossistema de multi-agentes (PO, Architect, Executor), a causa-raiz de um erro muitas vezes reside em uma **decisão de planejametno** e não em um erro de digitação.

---

## 🧱 Detalhamento das Fases

### FASE 0: A Fundação (Base)
*   **Ação**: Centralização do logger e criação do `ExecutionID`.
*   **Impacto**: Permite agrupar todas as ações de uma mesma tarefa (do PO ao QA) sob o mesmo código.
*   **Importância**: Sem a fase 0, os logs são "ruído". Com ela, eles se tornam uma **linha do tempo**.

### FASE 1: O "Porquê" (Prompt Layer)
*   **Ação**: Obrigatoriedade do campo `decision.reason` em todas as Skills.
*   **Impacto**: A IA pára de apenas entregar código e passa a entregar a **lógica** por trás dele.
*   **Importância**: Fundamental para o debug. Se o botão ficou azul em vez de vermelho, o log dirá se a IA fez isso por erro ou por uma interpretação errada do manual.

### FASE 2: Rastreio de Deliberação (Sync Trace)
*   **Ação**: Registro detalhado dos rounds de discussão entre PO e Architect.
*   **Impacto**: Visibilidade total sobre os vetos técnicos do Arquiteto.
*   **Importância**: Identifica gargalos de comunicação antes que eles virem código quebrado.

### FASE 3: Discovery de Legado (Context Trace)
*   **Ação**: Registro do que o Context Scanner encontrou.
*   **Impacto**: Prova documental de reuso de código.
*   **Importância**: ROI de Negócio. Demonstra o quanto de esforço foi poupado ao não recriar funções existentes.

### FASE 4: Auto-Diagnóstico de Falha (QA Failure)
*   **Ação**: Diff automático entre Contrato Escolhido vs Código Entregue.
*   **Impacto**: O erro aponta para si mesmo. "Falha: O contrato pedia X, o Executor entregou Y".
*   **Importância**: Redução drástica do tempo de manutenção e correção.

---

## 🔄 Plano de Incrementação no BOLT

A integração desta camada de logs no BOLT já construído seguirá os seguintes passos técnicos:

1.  **Instrumentação de Skills**: Atualizaremos os arquivos `system.txt` das skills existentes para exigir a estrutura de output JSON com `decision` e `reason`.
2.  **Controller Injection**: O `deliberation.controller.js` será o herdeiro de todos os logs das rodadas de negociação.
3.  **Audit Hub**: Todas as validações AJV passarão a alimentar o `/logs/governance.log` de forma unificada.

---

## ✅ Checklist de Próximos Passos (Ação)

- [ ] **Instrumentação Base (Fase 0)**: Implementar o `execution_id` gerado no [main.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/main.js) do BOLT.
- [ ] **Padronização de Schema (Fase 1)**: Publicar o [audit-schema.json](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/contracts/audit-schema.json) v2 com os campos de decisão obrigatórios.
- [ ] **Deliberação Rastreável (Fase 2)**: Configurar o diretório `/logs/deliberation/` para persistência de rounds.
- [ ] **Memória de Decisão (Fase 6)**: Criar o repositório `/governance/decisions` para padrões globais.

**"O BOLT não apenas faz; ele explica por que faz, garantindo a evolução contínua da elite."** ⚡📐💎🚀
