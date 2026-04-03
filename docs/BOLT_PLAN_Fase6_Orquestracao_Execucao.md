# Plano de Implementação: Fase 6 (Execução Orquestrada & Persistência)

A Fase 6 transforma a deliberação teórica do protocolo BOLT em ação física segura no sistema Spin4all.

---

## Objetivos
1. **SSoT Persistence**: Armazenar cada Manifesto Final (v2.16) em banco de dados para auditoria histórica e recuperação de desastres.
2. **Orchestrated Handover**: Criar a interface de comunicação entre o [DeliberationController](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/controllers/deliberation-controller.js#11-228) e o Agente Executor.
3. **Strict Enforcement Loop**: Garantir que o executor não apenas receba as restrições, mas reporte impedimentos em tempo real.

---

## Mudanças Propostas

### 💾 Camada de Persistência (Database Elite v1.1)

O armazenamento em Postgres (JSONB) é otimizado para queryabilidade, rastreabilidade e auditoria histórica massiva.

#### Schema: Tabela `bolt_manifests`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `execution_id` | UUID (PK) | Identificador único de cada deliberação. |
| `contract_version` | TEXT | Versão do protocolo gerador (ex: `v2.16`). |
| `status` | TEXT | Status final: `converged \| degraded \| blocked \| escalated`. |
| `tags` | TEXT[] | Tags de contexto para busca rápida (ex: `['auth', 'database']`). |
| `manifest` | JSONB | O Master Manifest completo (v2.16) com metrics, scope, plan. |
| `created_at` | TIMESTAMP | Data de criação. |
| `updated_at` | TIMESTAMP | Data de última atualização. |

#### Índices de Performance:
```sql
CREATE INDEX idx_bolt_status ON bolt_manifests(status);
CREATE INDEX idx_bolt_created_at ON bolt_manifests(created_at);
CREATE INDEX idx_bolt_tags ON bolt_manifests USING GIN (tags);
```

> **Por que GIN em tags?** O índice GIN (Generalized Inverted Index) é o tipo mais eficiente do Postgres para buscas em arrays. Permite filtrar por `'auth' = ANY(tags)` em millisegundos mesmo com milhares de manifestos.

#### [NEW] [governance-repository.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/repositories/governance-repository.js)
- Métodos previstos: `saveManifest(id, manifest, tags)`, `getManifest(id)`, `filterByStatus(status)`, `filterByTag(tag)`, `getHistory(limit)`.

---

### 🔄 Controle de Estado em Tempo Real (Runtime State)

A tabela `bolt_manifests` armazena o plano e o resultado final, mas não o estado vivo da execução. Para saber **onde falhou** e **poder retomar**, precisamos de uma segunda tabela dedicada ao estado de runtime.

#### Schema: Tabela `bolt_executions`

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `execution_id` | UUID (FK → bolt_manifests) | Vínculo com o manifesto de origem. |
| `current_step` | INTEGER | Número do passo em andamento ou onde parou. |
| `status` | TEXT | `running \| paused \| completed \| failed \| retrying`. |
| `logs` | JSONB | Array de logs por step: `[{step, action, status, error, ts}]`. |
| `started_at` | TIMESTAMP | Início da execução. |
| `updated_at` | TIMESTAMP | Última atualização (heartbeat do executor). |

#### Relação entre as Tabelas:

```
bolt_manifests (plano + decisão final)
     │
     └── bolt_executions (estado em tempo real, step a step)
```

#### Recursos Habilitados por esta Tabela:
- **Rastreamento Granular**: Ver exatamente em qual passo a execução está ou parou.
- **Retomada Inteligente**: Ao reprocessar, o executor consulta `current_step` e continua de onde parou — não reinicia do zero.
- **Heartbeat**: O campo `updated_at` age como "sinal de vida". Se ficar sem atualização por mais de 60s, um processo watchdog pode declarar a execução como `timed_out`.



### 🛰️ Integração de Execução

#### [MODIFY] [deliberation-controller.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/controllers/deliberation-controller.js)
- Adicionar hook de persistência automática ao final de cada execução.

#### [NEW] [orchestrator-executor.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/orchestrators/orchestrator-executor.js)

O executor consome o Manifesto v2.16 e executa os passos do `execution_plan` com **garantias industriais de resiliência**:

##### Garantias Críticas de Execução (v1.2):

**1. Execução Idempotente**
- Cada passo do `execution_plan` deve ser idempotente: executar a mesma ação 2x não causa efeitos colaterais indesejados.
- O executor verifica o estado atual antes de aplicar a mudança (ex: índice já existe → skipa, não falha).

**2. Retry Policy**
- Em caso de falha transitória, o executor realiza até **3 tentativas** com backoff exponencial (100ms, 300ms, 900ms).
- Se após 3 tentativas o passo ainda falhar, o executor marca o passo como `FAILED` e interrompe a cadeia.
- A política é configurável por passo via campo `retry_policy` no `execution_plan`.

```json
"execution_plan": {
  "steps": [
    {
      "order": 1,
      "action": "Update DB Index",
      "scope": "infrastructure",
      "retry_policy": { "max_attempts": 3, "backoff_ms": 100 }
    }
  ]
}
```

**3. Lock por `execution_id`**
- Antes de iniciar qualquer passo, o executor adquire um **lock exclusivo** por `execution_id` no banco.
- Impede concorrência: dois executores não podem processar o mesmo manifesto simultaneamente.
- Lock liberado automaticamente ao fim da execução ou após timeout de 30s (proteção anti-deadlock).

---

## 🛡️ Estratégia de Segurança & Rollback (Saga Pattern)

Em transações distribuídas (DB + código + infra), não existe rollback atômico global. O protocolo BOLT adota o **Saga Pattern** para garantir reversibilidade controlada.

### Rollback por Step

Cada passo do `execution_plan` define sua própria ação de compensação:

```json
"execution_plan": {
  "steps": [
    {
      "order": 1,
      "action": "create_index_users_email",
      "scope": "infrastructure",
      "rollback": "drop_index_users_email",
      "retry_policy": { "max_attempts": 3, "backoff_ms": 100 }
    },
    {
      "order": 2,
      "action": "update_auth_controller",
      "scope": "backend",
      "rollback": "revert_auth_controller_to_previous",
      "retry_policy": { "max_attempts": 3, "backoff_ms": 100 }
    }
  ]
}
```

### Política de Fallback Parcial

| Cenário | Comportamento |
| :--- | :--- |
| Passo 1 falha após 3 tentativas | Rollback do Passo 1. Cadeia interrompida. Status: `FAILED`. |
| Passo 2 falha (Passo 1 OK) | Rollback do Passo 2 via `compensating_action`. Passo 1 mantido se idempotente. |
| Fallback parcial permitido? | **Configurável**: campo `allow_partial_success` no manifesto. |

> **Por que Saga e não Two-Phase Commit (2PC)?** O 2PC trava recursos até confirmação e é inviável entre DB, filesystem e APIs. O Saga Pattern garante consistência eventual com compensações explícitas — padrão adotado por sistemas como Netflix, Uber e Stripe em contextos de microserviços.

### Audit Log por Step (Structured v1.1)

O `audit_log` é o registro imutável da execução, persistido na coluna `logs` da tabela `bolt_executions`. Cada entrada corresponde a um único passo do `execution_plan`.

#### Schema do Registro:

```json
"audit_log": [
  {
    "timestamp": "2026-03-25T16:14:00.000Z",
    "step": 1,
    "action": "create_index_users_email",
    "scope": "infrastructure",
    "status": "success",
    "duration_ms": 120,
    "error": null
  },
  {
    "timestamp": "2026-03-25T16:14:02.000Z",
    "step": 2,
    "action": "update_auth_controller",
    "scope": "backend",
    "status": "failed",
    "duration_ms": 300,
    "error": "SyntaxError: Unexpected token at line 42"
  }
]
```

#### Campos e Semântica:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `timestamp` | ISO 8601 | Momento exato em que o passo foi executado. |
| `step` | INTEGER | Número de ordem do passo (corresponde ao `order` do `execution_plan`). |
| `action` | TEXT | Identificador da ação executada. |
| `scope` | TEXT | Domínio da mudança: `infrastructure \| backend \| frontend`. |
| `status` | TEXT | `success \| failed \| skipped \| retried`. |
| `duration_ms` | INTEGER | Tempo de execução do passo em milissegundos. |
| `error` | TEXT\|null | Mensagem de erro, se houver. `null` em caso de sucesso. |

> **Onde é persistido?** O `audit_log` é armazenado no campo `logs` (JSONB) da tabela `bolt_executions`, vinculado ao `execution_id`. O manifesto em `bolt_manifests` mantém apenas o resumo final — o log detalhado live na tabela de execução.

---

## Plano de Verificação
- **E2E DB**: Validar que um manifesto `CONVERGED` foi salvo corretamente com todos os metadados v2.16.
- **E2E Execution Flow**: Simular a execução de um plano de 2 passos e verificar se o executor reporta sucesso.

---

## Refinamentos Avançados de Execução (v1.3)

A seguir, detalhamos os refinamentos de resiliência e segurança que elevam o executor ao padrão industrial.

---

### 1. 🌐 Side Effects Externos (API, Filas, Integrações)

Nem todo step do `execution_plan` opera em domínios reversíveis. Chamadas a APIs externas, filas de mensagens e integrações de terceiros **não garantem rollback**.

```json
{
  "order": 3,
  "action": "notify_external_crm",
  "scope": "integration",
  "side_effects": ["external_api"],
  "compensation_guarantee": "best_effort"
}
```

| Valor `compensation_guarantee` | Comportamento |
| :--- | :--- |
| `guaranteed` | A compensação é confiável e reversível. |
| `best_effort` | A compensação será tentada mas pode não ser completada (ex: e-mail já enviado). |
| `none` | Sem ação de compensação possível. O executor deve alertar e logar. |

> **Regra**: passos com `compensation_guarantee: none` devem ser executados **por último** no `execution_plan` para minimizar impacto em caso de falha geral.

---

### 2. 🔒 Lock com Heartbeat Renewal (Anti-Expiração)

O timeout fixo de 30s é frágil para steps longos. A solução é o **lock renovável via heartbeat**:

- O executor atualiza o lock a cada **10 segundos** enquanto o step estiver em execução.
- Se o executor morrer, o lock não é renovado e expira naturalmente após o timeout base.
- A estratégia elimina o risco de dois executores concorrentes assumirem o mesmo `execution_id`.

```
Executor → [START] → acquireLock(execution_id)
          → [RUNNING] → renewLock() a cada 10s
          → [DONE/FAILED] → releaseLock(execution_id)
```

---

### 3. 🚦 Step Status Machine (Ciclo Completo)

O ciclo de vida de cada step deve ser explícito e rastreável:

```
pending → running → success
                 → failed → retrying → success
                                    → rolled_back
                 → skipped
```

| Status | Descrição |
| :--- | :--- |
| `pending` | Aguardando execução. |
| `running` | Em execução ativa. |
| `success` | Concluído com êxito. |
| `failed` | Falhou após esgotar tentativas. |
| `retrying` | Em nova tentativa (backoff ativo). |
| `rolled_back` | Compensação executada com sucesso. |
| `skipped` | Pulado por idempotência (já estava no estado desejado). |

---

### 4. 🔁 Retry Policy Inteligente por Tipo de Erro

A política de retry deve distinguir **erros transitórios** (rede, timeout) de **erros lógicos** (validação, sintaxe) — pois retries em erros lógicos são desperdício.

```json
"retry_policy": {
  "max_attempts": 3,
  "strategy": "exponential",
  "backoff_ms": 100,
  "retry_on": ["timeout", "network_error", "lock_conflict"],
  "abort_on": ["validation_error", "syntax_error", "permission_denied"]
}
```

| Campo | Descrição |
| :--- | :--- |
| `strategy` | `exponential` (100ms/300ms/900ms) ou `fixed` (intervalo fixo). |
| `retry_on` | Lista de tipos de erro que ativam o retry. |
| `abort_on` | Lista de tipos que interrompem imediatamente (sem retry). |

---

### 5. 🛡️ Execution Guardrails por Impacto

O executor verifica o `impact_scope` antes de iniciar e pode **bloquear ativamente** execuções que ultrapassem os limites declarados:

```json
"execution_guardrails": {
  "max_files_changed": 10,
  "max_diff_size": "large",
  "block_on_violation": true
}
```

- Se a execução real exceder os limites declarados no `impact_scope`, o executor interrompe e reporta `GUARDRAIL_VIOLATED`.
- `block_on_violation: false` → apenas alerta (modo auditoria).
- `block_on_violation: true` → interrompe a cadeia (modo enforcement).

---

### 6. 📸 Checkpointing Formal (State Snapshots)

O `current_step` na tabela `bolt_executions` diz *onde* parou. O **checkpoint** diz *em que estado* o sistema estava:

```json
"checkpoints": [
  {
    "step": 1,
    "completed_at": "2026-03-25T16:14:01.000Z",
    "state_snapshot": {
      "index_created": true,
      "rows_affected": 1200
    }
  }
]
```

- Os checkpoints são persistidos no campo `logs` da tabela `bolt_executions`.
- Permitem **retomada precisa**: ao reiniciar, o executor restaura o `state_snapshot` do último checkpoint e prossegue do passo seguinte.
- O `state_snapshot` é definido pelo Arquiteto no `execution_plan` e preenchido pelo executor em runtime.
