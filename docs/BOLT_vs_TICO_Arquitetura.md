# 🛰️ BOLT vs TICO — Evolução da Arquitetura (v2)

## 🎯 Objetivo

Documentar de forma clara o que muda do **TICO (modelo atual)** para o **BOLT (modelo evoluído)**, incluindo:

- Deliberação como núcleo
- Separação de modos (consultor vs executor)
- Descoberta de legado (Context Scanner)

---

# 🧠 Visão Geral da Evolução

## TICO (Atual)

- Arquitetura centralizada
- Architect cria contratos
- Fluxo sequencial

## BOLT (Novo)

- Arquitetura colaborativa
- Deliberação como núcleo
- Separação entre pensar e executar
- Contrato consolidado no final
- Descoberta de legado obrigatória

---

# 🧱 Estrutura de Diretórios — TICO vs BOLT

## 📂 TICO (Atual)

```
/governance
  ├── /skills
  │   ├── /frontend
  │   ├── /backend
  │   ├── /arquiteto
  │   └── /po
  ├── /contracts
  ├── /orchestrator
  ├── /logs
  ├── /tests
  ├── agent-controller.js
  ├── promote.js
  └── main.js
```

---

## ⚙️ BOLT (Evoluído)

```
/governance
  ├── /skills
  │   ├── /frontend
  │   ├── /backend
  │   ├── /arquiteto
  │   ├── /po
  │   ├── /contract-finalizer
  │   ├── /deliberation
  │   └── /context-scanner   # 🆕 discovery de legado

  ├── /contracts
  │   ├── audit-schema.json
  │   ├── task-manifest-schema.json
  │   └── contract-schema.json

  ├── /orchestrator
  │   ├── deliberation.controller.js
  │   └── planning.orchestrator.js

  ├── /logs
  │   ├── governance.log
  │   └── deliberation.log

  ├── /decisions
  ├── /tests

  ├── agent-controller.js
  ├── promote.js
  └── main.js
```

---

# 🔄 Mudanças por Camada

## 1. Skills

### TICO
- Cada agente atua isoladamente
- Architect cria contratos sozinho

### BOLT
- Agentes contribuem com **inputs estruturados**
- Separação de modos:
  - consultor → pensa
  - executor → implementa
- Novo agente: **Contract Finalizer**
- Novo agente: **Context Scanner**

---

## 2. Contracts

### TICO
- Gerado pelo Architect

### BOLT
- Resultado de deliberação
- Consolidado pelo Contract Finalizer
- Fonte única de verdade

---

## 3. Orchestrator

### TICO
```
PO → Architect → Execução
```

### BOLT
```
PO
↓
Context Scanner
↓
Backend/Frontend (consultor)
↓
PO ↔ Architect (deliberação)
↓
Contract Finalizer
↓
Backend/Frontend (executor)
```

---

## 4. Deliberation Layer

- Loop controlado (máx 3 interações)
- Apenas PO ↔ Architect deliberam
- Backend/Frontend apenas fornecem input

---

## 5. Modos de Execução (NOVO)

### Backend / Frontend

#### 🧠 Modo Consultor
- sugere payload
- sugere resposta
- define erros
- NÃO executa código

#### ⚙️ Modo Executor
- implementa contrato final
- gera código/diff
- NÃO toma decisão

---

## 6. Context Scanner (Discovery)

Responsável por:

- ler READMEs
- mapear endpoints existentes
- mapear services
- mapear componentes

### Regra:

> Nenhuma feature pode ser criada sem verificar o legado

---

## 7. Logs

### TICO
- logs de execução

### BOLT
- logs de deliberação
- rastreabilidade de decisões

---

## 8. Decision Memory

- armazena padrões
- evita inconsistência

---

# 🧠 Mudança de Mentalidade

## TICO
> Definir corretamente

## BOLT
> Eliminar ambiguidade antes de executar

---

# ⚠️ Regras do BOLT

1. Deliberação é obrigatória
2. Apenas PO e Architect decidem
3. Backend/Frontend são consultores (antes) e executores (depois)
4. Contract Finalizer é obrigatório
5. Discovery de legado é obrigatório

---

# 🚀 Benefícios

- menos duplicação
- menos erro de integração
- maior previsibilidade
- contratos consistentes

---

## 9. Infraestrutura de Suporte & Segurança (LEGADO ELITE)

O BOLT herda e aprimora os componentes físicos do TICO para garantir isolamento total:

| Recurso | Função no BOLT | Implementação Técnica |
| :--- | :--- | :--- |
| **Sandbox** | Isolamento de Execução | Pastas `/draft` e `/prod` com sincronia via `promote.js`. |
| **Testes UI** | Validação de Fidelidade | Playwright Smoke Tests rodados automaticamente pela Skill de QA. |
| **API Integrity** | Prevenção de Quebra | Bloqueio de respostas não-JSON na camada de orquestração. |
| **Telemetria** | Rastreabilidade Industrial | Uso obrigatório de `ExecutionID` e `CorrelationID` via Winston. |

---

# 🏁 Conclusão

BOLT não aumenta complexidade — ele organiza melhor:

- quem pensa
- quem decide
- quem executa

---

# 🎯 Resumo Final

> TICO organiza execução
> BOLT garante clareza antes de executar

