# TICO --- Arquitetura de Missões (v3.1 Consolidada)

## Objetivo
Implementar progressivamente a arquitetura de agentes no Antigravity com baixo risco, alta rastreabilidade e validação incremental. **O TICO é um produto de automação de missões e agentes, independente do protocolo de governança BOLT.**

---

## Estratégia Geral (v3.1)
Princípios:
- Implementação incremental (não big bang)
- Cada camada validada isoladamente
- Sempre manter sistema funcional
- **Prompt como Artefato**: System Instructions, Input Model e Output Contract são versionados.

---

## Pipeline de Execução TICO
``` txt
User Input
   ↓
Planning Orchestrator (PO + Architect)
   ↓
💬 Deliberation Layer (estratégica)
   ↓
Contracts + Tasks
   ↓
🔄 Execution Sync Layer (Frontend ↔ Backend)
   ↓
Execução (Agent Workspace)
   ↓
Diff + Tests
   ↓
QA Validator
   ↓
Promote
```

---

## Prompt Architecture (Governança de IA)

O TICO transforma o "prompt" de uma instrução volátil em um artefato governado:

1.  **SYSTEM INSTRUCTIONS**: Define o comportamento fixo da skill (ex: `system.v1.txt`).
2.  **INPUT MODEL**: Define a estrutura do request (JSON Schema) para evitar alucinação.
3.  **OUTPUT CONTRACT**: Validado via QA contra o contrato definido pelo Arquiteto.

Estrutura de diretório recomendada:
```
/skills/{skill_name}/
  ├── system.v1.txt
  ├── input.v1.json
  ├── output.v1.json
  ├── tests/
  └── manifest.json
```

---

## Detalhamento das Fases

### FASE 0-2: A Fundação & Executores
- Estrutura de pastas, logger estruturado (ExecutionID).
- Primeira skill funcional (**Frontend UI Executor**) com validação de diff e rollback.
- Roteamento automático via **Classifier**.

### FASE 3-5: Inteligência & Planejamento
- Implementação do **PO Skill** (geração de tasks) e **Architect Skill** (contract-first).
- Integração no **Planning Orchestrator**.

### FASE 6-8: Deliberação & Sincronização
- **Deliberation Layer**: Registro transparente de decisões.
- **Execution Sync Layer**: Alinhamento em tempo real (Frontend ↔ Backend) durante a escrita de código.
- **QA Validator**: Validação final de contrato e comportamento antes do promote.

---

## Governança do Produto TICO
Regras:
- Nenhuma skill sem system instructions e input model.
- Prómpt NÃO pode ficar inline; tudo deve ser versionado no sistema de arquivos.
- Logs obrigatórios para cada interação de agente.

---
**Nota Editorial**: Este documento consolida o Plano de Implementação original, o Update Plan (Prompts Architecture) e a Arquitetura v3 (Sync Layer) em um único SSoT para o sistema TICO.
