# Plano de Implementação: Fase 7 — Sandbox & Promoção Transacional (v2 Hardening)

A Fase 7 transforma o BOLT de **executor inteligente** em uma **plataforma de change management transacional orientada por intenção** — com isolamento físico, promoção atômica real, rollback via ponteiro e auditabilidade total.

> [!NOTE]
> **Status**: Em refinamento de planejamento. Nenhuma ação de implementação foi iniciada. Este documento é o SSoT (Source of Single Truth) da Fase 7.

---

## Visão Geral Estratégica

Até a Fase 6, o BOLT delibera e orquestra com precisão industrial. O `DeliberationController` produz um `Master Manifest` bem definido, o `OrchestratorExecutor` processa steps com retry, lock e rollback. Mas existe um gap crítico: **o Agente Executor ainda não tem um ambiente seguro para escrever código**. Hoje, o método `_runAction` é um mock — ele simula execução. Quando for real, ele estaria escrevendo diretamente no filesystem de produção sem nenhuma barreira.

A Fase 7 corrige isso introduzindo um modelo de **deployment controlado estilo CI/CD interno**, inspirado em sistemas como Heroku (slug + dyno), Capistrano (releases + symlink) e Kubernetes (rolling update):

| Problema atual | Solução da Fase 7 |
| :--- | :--- |
| Executor escreveria direto no `/src` | Executor escreve exclusivamente no `/draft/{execution_id}/` |
| Sem validação antes da mudança ir a prod | Pre-Promotion Gate com lint, testes e contract validation |
| Rollback manual e frágil (arquivos copiados de volta) | Rollback via symlink (atômico, instantâneo, sem risco) |
| Sem rastreabilidade de versão ativa em produção | Releases imutáveis versionadas + ponteiro explícito (`pointer`) |
| Crash no meio da promoção = estado híbrido corrompido | Atomic swap via `rename()` + `ln -sfn` (kernel-level) |
| Sem controle se duas promoções rodarem ao mesmo tempo | Lock global de promoção via Postgres Advisory Lock |

### Por que isso importa?

Sem essa camada, o BOLT seria como um cirurgião operando sem luvas. Ele sabe o que fazer, tem a técnica, mas qualquer contaminação ao longo do processo compromete todo o resultado. A Fase 7 são as luvas, a sala estéril e o protocolo de segurança.

---

## Princípios de Design (Não Negociáveis)

Esses princípios são a constituição da Fase 7. Qualquer decisão de implementação que viole um deles deve ser rejeitada.

1. **Atomicidade real** — Uma operação ou é aplicada completamente ou não é aplicada. Não existe "meio aplicada". Isso é garantido pelo kernel via `rename()` e `ln -sfn`, nunca por cópia de arquivos.

2. **Determinismo** — Dado o mesmo `Master Manifest` e o mesmo estado do filesystem, a promoção sempre produz o mesmo resultado. Não há comportamento estocástico ou dependente de ordem de execução concorrente.

3. **Isolamento forte** — O executor não tem acesso físico ao filesystem de produção durante a escrita. Ele opera apenas em `draft/{execution_id}/`. Isolamento lógico (checar string de path) é insuficiente — o sistema precisa de isolamento físico (diretório separado com acesso controlado).

4. **Reversibilidade completa** — Qualquer promoção pode ser desfeita em milissegundos. O rollback não depende de restore manual, não perde dados, não tem edge cases. É simplesmente mudar o ponteiro de versão.

5. **Auditabilidade total** — Qualquer pessoa deve conseguir responder: "Quem mudou o quê, quando, por qual razão, e com qual resultado?" Isso requer manifest com hashes, logs estruturados por evento e histórico imutável de releases.

6. **Serialização de promoção** — Apenas uma promoção ocorre por vez no sistema inteiro. Concorrência de promoção é uma das causas mais comuns de corrupção de estado em sistemas de deployment.

---

## Objetivos

1. **Isolamento de Impacto**: O Agente Executor escreve exclusivamente no diretório `scripts/bolt/draft/{execution_id}/`. O diretório de cada execução é isolado dos outros, garantindo que duas execuções simultâneas nunca interfiram nos rascunhos uma da outra.

2. **Promoção Atômica Real**: A promoção usa `rename()` para mover a release para `production/releases/` e `ln -sfn` para trocar o ponteiro. Essas operações são atômicas no kernel do Linux — o filesystem nunca fica em estado intermediário, mesmo que o processo crash no meio.

3. **Rollback Confiável**: Rollback é uma mudança de ponteiro de versão (`ln -sfn releases/{previous_version} production/pointer`), não um restore manual de arquivos. Isso elimina os edge cases do restore: arquivos novos que precisariam ser deletados, permissões que precisariam ser restauradas, metadata que pode ser perdido.

4. **Auditoria de Diff Estruturada**: Diff unificado (git-like) agrupado por arquivo, com indicação de impacto (`small | medium | large`) e tipo de operação (`modified | created | deleted`). A revisão humana antes da promoção é obrigatória para execuções com `risk_score` acima de threshold configurável.

5. **State Machine Explícita**: Cada execução transita por 9 estados rastreáveis no banco, sem transições implícitas. Todo estado é registrado com timestamp, `actor` (quem/o que causou a transição) e metadados adicionais. Isso garante rastreabilidade forense completa.

6. **Sandbox Técnica em 3 Níveis**: Do MVP (normalização de path com `path.resolve()`) ao enterprise (container isolado por execução com filesystem mountado apenas no `draft/{id}`). O nível mínimo é obrigatório desde o primeiro deploy.

---

## Estrutura de Diretórios (v2 Final)

A estrutura de diretórios reflete a arquitetura de releases imutáveis com ponteiro, inspirada no modelo do Capistrano (deploy de Rails):

```
scripts/bolt/
├── draft/
│   └── {execution_id}/          <-- O Executor escreve aqui (escopo isolado por execução)
│       ├── backend/src/...       <-- Espelha a estrutura do projeto real
│       └── frontend/...
│
├── staging/
│   └── {execution_id}/          <-- Cópia do draft para validação (efêmera, vive só durante o gate)
│
├── production/
│   ├── current/                 <-- Estado ativo real (symlink ou diretório)
│   ├── releases/
│   │   ├── v_2026_03_26_001/    <-- Release imutável (nunca modificada após criação)
│   │   ├── v_2026_03_27_002/
│   │   └── ...
│   └── pointer                  <-- Symlink apontando para a release ativa
│
├── backups/
│   └── {execution_id}/
│       ├── manifest.json        <-- Lista de arquivos + hashes do estado pré-promoção
│       └── files.tar.gz         <-- Snapshot compactado do estado pré-promoção
│
├── manifests/
│   └── {execution_id}.json      <-- Manifest central com hashes, versão e status
│
└── locks/
    └── promotion.lock           <-- Arquivo de lock de promoção (fallback filesystem)
```

### Por que essa estrutura?

- **`draft/` por execution_id**: Isola completamente duas execuções paralelas. Se duas deliberações rodarem ao mesmo tempo, cada uma escreve em seu próprio sandbox sem interferência.
- **`staging/`**: A cópia para staging (antes da validação) garante que o draft permanece intacto caso a validação falhe. O draft é a "fonte da verdade" do rascunho; staging é uma cópia descartável para teste.
- **`production/releases/`**: Cada release é imutável após criação. Isso garante que qualquer rollback aponta para um estado exatamente conhecido e verificável.
- **`production/pointer`**: O symlink é o único ponto mutável do sistema de produção. Mudar a versão ativa é apenas mudar para onde esse ponteiro aponta.

> [!WARNING]
> **Nota de compatibilidade Windows**: O symlink via `ln -sfn` é uma operação nativa em Linux/Mac (ambiente de produção). Em desenvolvimento local Windows, o `mklink /J` (junction) pode ser usado como alternativa, mas o comportamento não é idêntico. A recomendação é usar WSL2 ou Docker para desenvolvimento local, garantindo paridade com o ambiente de produção. A implementação deve detectar o OS e tratar essa diferença explicitamente.

---

## State Machine Formal (9 Estados)

Cada execução de promoção transita por estados explícitos e rastreáveis. **Nenhuma transição é implícita.** Cada mudança de estado é registrada no banco com `timestamp`, `actor` (usuário ou processo que causou) e metadados adicionais.

```
CREATED
  → DRAFTING           (executor começou a escrever no draft)
  → DRAFT_READY        (executor sinalizou que o draft está completo)
  → VALIDATING         (pre-promotion gate iniciado)
  → VALIDATED          (todos os checks passaram)
  → READY_FOR_PROMOTION  (aguardando aprovação humana ou automática)
  → PROMOTING          (atomicSwap em andamento — lock ativo)
  → PROMOTED           (swap concluído, pointer atualizado)
       ↓                      ↓
    FAILED             ROLLED_BACK
  (gate falhou ou      (promoção falhou após swap,
   swap abortou)        pointer revertido para versão anterior)
```

### Semântica de cada estado:

| Estado | Descrição | Próximo estado possível |
| :--- | :--- | :--- |
| `CREATED` | Execução registrada no banco, draft vazio | `DRAFTING` |
| `DRAFTING` | Executor está escrevendo arquivos no draft | `DRAFT_READY`, `FAILED` |
| `DRAFT_READY` | Executor finalizou. Draft pronto para promoção | `VALIDATING` |
| `VALIDATING` | Pre-Promotion Gate em execução | `VALIDATED`, `FAILED` |
| `VALIDATED` | Todos os checks passaram. Diff gerado. | `READY_FOR_PROMOTION` |
| `READY_FOR_PROMOTION` | Aguardando aprovação (humana ou automática) | `PROMOTING` |
| `PROMOTING` | Lock global ativo. Swap em andamento. | `PROMOTED`, `ROLLED_BACK` |
| `PROMOTED` | Pointer atualizado. Release ativa em produção. | — (estado final) |
| `FAILED` | Falha em qualquer etapa anterior ao swap. | — (estado final) |
| `ROLLED_BACK` | Promoção falhou após swap. Pointer revertido. | — (estado final) |

### Por que isso é crítico?

Sem estado explícito, se o processo cair durante `PROMOTING`, o sistema não sabe:
- O swap foi completado?
- O pointer foi atualizado?
- O cleanup foi feito?

Com a State Machine, um processo de recovery pode verificar o estado e retomar de onde parou ou executar o rollback determinístico.

---

## Modelo de Promoção: Staging + Atomic Swap

**Fluxo real:** `draft → staging → validation → release → atomic swap → cleanup`

Este modelo é baseado no mesmo princípio usado pelo Capistrano, que tem décadas de uso em produção. A ideia central é: **nunca modifique o que está em produção diretamente**. Prepare tudo ao lado, valide completamente, e então faça a troca de forma atômica.

| Etapa | Operação | Garantia Técnica |
| :--- | :--- | :--- |
| **1. Preparação** | Copiar `draft/{id}` → `staging/{id}` + validar paths contra `allowed_paths` | Se um path inválido for encontrado, a operação para aqui. Nada foi movido. |
| **2. Validação** | Executar Pre-Promotion Gate completo contra `staging/{id}` | Se qualquer check falhar, staging é removido e status vira `FAILED`. Draft preservado. |
| **3. Criação de Release** | Criar `production/releases/{version_id}/` com os arquivos do staging | Release imutável criada. Staging pode ser removido com segurança. |
| **4. Atomic Swap** | `ln -sfn releases/{version_id} production/pointer` | **Operação atômica no kernel.** Não há estado intermediário. |
| **5. Cleanup** | Remover staging, marcar draft para cleanup em 24h, emitir logs | Estado limpo. Backup retido conforme política de retenção. |

### Por que `ln -sfn` e não `cp` ou `mv`?

`cp` (cópia) não é atômica — um crash no meio deixa arquivos parcialmente copiados.

`mv` pode ser atômico se os diretórios estiverem no mesmo filesystem, mas não garante atomicidade entre filesystems diferentes.

`ln -sfn` (symlink forçado) é **sempre atômico** na troca do ponteiro porque é uma única operação de atualização de inode no diretório. O filesystem garante que o ponteiro aponta sempre para uma versão completa — nunca para um estado intermediário.

> [!IMPORTANT]
> Um crash no servidor durante `ln -sfn` não pode corromper o estado de produção. O pointer ou aponta para a versão anterior (se o crash foi antes) ou para a nova versão (se foi depois). Não existe estado intermediário.

---

## Rollback Via Ponteiro (Reformulado)

A lógica de "restore manual de arquivos" foi **completamente eliminada**. O modelo de rollback é baseado exclusivamente em mudar o ponteiro de versão ativa.

```bash
# Identificar a versão anterior
previous_version=$(cat scripts/bolt/production/.previous_pointer)

# Rollback = 1 comando, instantâneo, 100% seguro
ln -sfn releases/${previous_version} production/pointer

# Registrar o rollback no banco
# UPDATE bolt_executions SET status = 'ROLLED_BACK' WHERE execution_id = $1
```

### Por que o restore manual falha?

O restore manual tem múltiplos edge cases que o tornam não confiável em produção:

| Problema do restore manual | Como o rollback via pointer resolve |
| :--- | :--- |
| **Arquivos novos não removidos**: o restore não sabe quais arquivos foram criados durante a promoção | Não relevante: o pointer aponta para o diretório de release anterior completo |
| **Arquivos deletados não restaurados**: se um arquivo foi deletado durante a promoção, o restore precisa saber disso | Não relevante: a release anterior está intacta e imutável |
| **Permissões e metadata perdidos**: `cp` pode não preservar permissões, timestamps e ACLs | Não relevante: a release anterior já tem as permissões originais |
| **Velocidade**: restaurar dezenas de arquivos pode levar segundos em disco com carga | `ln -sfn` é uma operação de nanosegundos |
| **Falha parcial do restore**: e se o restore falhar no meio? | Não aplicável: o pointer é atômico |

---

## Controle de Concorrência (Lock Global de Promoção)

> [!CAUTION]
> Este é um dos gaps mais críticos identificados na v1. Sem controle de concorrência, duas promoções simultâneas podem:
> - Sobrescrever os arquivos de staging uma da outra
> - Competir pelo mesmo pointer, resultando em comportamento indefinido
> - Fazer o rollback de uma quebrar a outra execução

A regra é absoluta: **apenas uma promoção pode ocorrer por vez** em todo o sistema, independentemente do `execution_id`.

### Opção 1: Filesystem Lock (MVP)

```javascript
// Usar o pacote 'proper-lockfile' ou similar
const lockfile = require('proper-lockfile');

async function acquirePromotionLock() {
  try {
    await lockfile.lock('scripts/bolt/locks/promotion.lock', {
      retries: { retries: 5, minTimeout: 1000 },
      stale: 30000 // lock expira após 30s se o processo morrer
    });
    return true;
  } catch (err) {
    console.error('[BOLT:PROMOTE] Failed to acquire promotion lock:', err.message);
    return false;
  }
}
```

**Limitação**: se o servidor reiniciar durante uma promoção, o lock de arquivo pode ficar bloqueado até o TTL de stale expirar.

### Opção 2: Postgres Advisory Lock (Recomendada)

```sql
-- Adquirir lock global de promoção (número arbitrário, único por sistema)
SELECT pg_try_advisory_lock(42);

-- Verificar se o lock foi adquirido (retorna true ou false)
-- Se retornar false, outra promoção está em andamento

-- Liberar após promoção (sucesso ou falha)
SELECT pg_advisory_unlock(42);
```

**Vantagem**: O lock é automaticamente liberado se a conexão com o banco cair (sem risco de lock eterno). Também é visível no `pg_locks` para debugging.

```javascript
async function executeWithPromotionLock(operation) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT pg_try_advisory_lock(42) as acquired');
    if (!rows[0].acquired) {
      throw new Error('Another promotion is already in progress. Try again later.');
    }
    return await operation(client);
  } finally {
    await client.query('SELECT pg_advisory_unlock(42)');
    client.release();
  }
}
```

---

## Manifest Central por Execução

O manifest é o **elemento central de governança** da Fase 7. Ele é gerado no início da promoção e permanece imutável após a criação da release. Qualquer pessoa (ou sistema) pode, a qualquer momento, verificar o que mudou, quando, e se os hashes batem com os arquivos em produção.

```json
{
  "execution_id": "exec_abc123",
  "version_id": "v_2026_03_26_001",
  "commit_hash": "sha256:global_checksum_of_all_changes",
  "timestamp": "2026-03-26T10:00:00Z",
  "promoted_at": "2026-03-26T10:02:45Z",
  "promoted_by": "bolt-orchestrator",
  "status": "PROMOTED",
  "master_manifest_ref": "bolt_manifests.execution_id = exec_abc123",
  "files": [
    {
      "path": "backend/src/api/auth.js",
      "action": "modified",
      "hash_before": "sha256:aaa111bbb222...",
      "hash_after": "sha256:ccc333ddd444...",
      "size_bytes_before": 4200,
      "size_bytes_after": 4350,
      "estimated_diff_size": "small"
    },
    {
      "path": "backend/src/services/auth-service.js",
      "action": "created",
      "hash_before": null,
      "hash_after": "sha256:eee555fff666...",
      "size_bytes_before": 0,
      "size_bytes_after": 890,
      "estimated_diff_size": "small"
    }
  ],
  "validation_results": {
    "lint": "passed",
    "unit_tests": "passed",
    "integration_tests": "passed",
    "contract_validation": "passed",
    "manifest_integrity": "passed",
    "scope_check": "passed"
  },
  "rollback_ref": "v_2026_03_25_003"
}
```

### O que o manifest habilita?

| Capacidade | Como o manifest a entrega |
| :--- | :--- |
| **Auditoria forense** | Quem promoveu, o quê, quando e com quais resultados de validação |
| **Rollback verificável** | `rollback_ref` aponta para a versão anterior exata |
| **Integridade de produção** | Hashes do manifest podem ser verificados contra os arquivos em `production/releases/` a qualquer momento |
| **Diff estruturado** | Lista de arquivos com `hash_before`/`hash_after` permite gerar diff sem precisar dos arquivos originais |
| **Rastreabilidade** | `master_manifest_ref` conecta a release de produção à deliberação BOLT que a originou |

---

## Sandbox Técnica em 3 Níveis

> [!WARNING]
> A sandbox "lógica" — verificar se o path começa com uma string específica — é fundamentalmente insuficiente. Path traversal (`../../src/`), symlinks dentro do draft e caminhos absolutos podem todos escapar sem qualquer detecção.

### Nível 1 — Mínimo Viável (Obrigatório desde o MVP)

Implementado no `_runAction` do `orchestrator-executor.js`:

```javascript
function validatePath(requestedPath, executionId) {
  // 1. Resolver o path completo (elimina ../ e symlinks relativos)
  const resolved = path.resolve(requestedPath);
  
  // 2. Definir o root permitido para esta execução
  const allowedRoot = path.resolve(`scripts/bolt/draft/${executionId}`);
  
  // 3. Verificar que o path resolvido começa com o root permitido
  if (!resolved.startsWith(allowedRoot + path.sep)) {
    throw new Error(`PATH_TRAVERSAL_DETECTED: ${requestedPath} resolves to ${resolved}, outside of ${allowedRoot}`);
  }
  
  // 4. Verificar se é um symlink (e rejeitar)
  try {
    const stat = fs.lstatSync(resolved);
    if (stat.isSymbolicLink()) {
      throw new Error(`SYMLINK_DETECTED: ${requestedPath} is a symbolic link`);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e; // arquivo não existe ainda = OK
  }
  
  return resolved;
}
```

**Proteções do Nível 1:**
- Bloqueia `../../src/api/auth.js` (path traversal)
- Bloqueia `/etc/passwd` (caminho absoluto externo)
- Bloqueia symlinks dentro do draft que apontam para fora

### Nível 2 — Recomendado para Produção

O executor é iniciado com o diretório de trabalho (`cwd`) definido como `scripts/bolt/draft/{executionId}/`. Qualquer operação de escrita com path relativo fica automaticamente confinada ao draft, sem depender apenas de validação de string.

Adicionalmente, o processo pode ser iniciado com permissões de filesystem restritas usando o módulo `chroot` ou equivalente, impedindo acesso físico a diretórios fora do draft.

### Nível 3 — Enterprise (Ideal a longo prazo)

Cada execução roda em um container efêmero com:
- Filesystem montado apenas para o `draft/{executionId}/` como `/workspace`
- Sem acesso à rede de produção durante a escrita
- Container destruído automaticamente após `DRAFT_READY`

Isso elimina completamente qualquer possibilidade de escape da sandbox, independente de como o código do executor foi escrito.

---

## 📁 Whitelist de Paths por Execução (`allowed_paths`)

Além da sandbox de diretório, cada execução declara explicitamente **quais arquivos específicos** podem ser modificados. O executor bloqueia qualquer escrita fora desta lista **antes mesmo de tentar gravar no draft**.

Esta declaração vem do `Master Manifest`, gerada pelo Arquiteto durante a deliberação:

```json
"execution_guardrails": {
  "allowed_paths": [
    "backend/src/api/auth.js",
    "backend/src/services/auth-service.js",
    "frontend/components/LoginForm.jsx"
  ],
  "allowed_operations": ["modify", "create"],
  "max_files_changed": 5,
  "max_diff_size": "medium"
}
```

### Como funciona na prática?

Se o executor tentar escrever em `backend/src/api/users.js` (não listado):
```
[BOLT:EXECUTOR] ❌ WRITE_BLOCKED: backend/src/api/users.js
  Reason: Not in allowed_paths for execution exec_abc123
  Allowed: backend/src/api/auth.js, backend/src/services/auth-service.js, frontend/components/LoginForm.jsx
  Action: Execution marked as FAILED. Rollback initiated.
```

O benefício desta dupla camada (sandbox de diretório + whitelist de arquivo) é que um executor com bug que tentar escrever no arquivo "errado" dentro da sandbox ainda é bloqueado.

---

## Pre-Promotion Validation Gate

O gate é executado contra o `staging/{execution_id}/` — nunca contra o draft diretamente. Isso garante que o draft permanece intacto mesmo se o gate falhar.

O gate é **bloqueante e sequencial**: cada check precisa passar antes do próximo iniciar. A primeira falha interrompe todo o processo.

| Check | O que valida | Exemplo de falha |
| :--- | :--- | :--- |
| **1. Verificação de escopo** | Nenhum arquivo fora do `allowed_paths` foi tocado | `users.js` modificado mas não está na whitelist |
| **2. Validação de manifest** | Hashes SHA256 dos arquivos no staging batem com o manifest | Arquivo corrompido ou modificado após o draft |
| **3. Lint** | Sintaxe e estilo dos arquivos modificados | `SyntaxError: Unexpected token` em `auth.js` |
| **4. Testes unitários** | Comportamento isolado dos módulos modificados | `AuthService.login()` retorna 500 em vez de 200 |
| **5. Testes de integração** | Interação entre componentes no contexto da mudança | Rota `/auth/login` não autoriza usuário válido |
| **6. Validação de contratos** | APIs modificadas não quebraram os contratos de I/O | Endpoint `/auth/login` removeu campo `token` do response |

### O que acontece se o gate falhar?

```
[BOLT:GATE] ❌ CHECK FAILED: unit_tests
  File: backend/src/services/auth-service.js
  Test: "should return 200 for valid credentials"
  Error: Expected status 200, received 500
  
[BOLT:GATE] Initiating failure protocol...
  → Removing staging/exec_abc123/
  → Preserving draft/exec_abc123/ (available for debugging)
  → Updating execution status: VALIDATING → FAILED
  → Emitting structured failure log
  → Skipping promotion (no changes made to production)
```

Nenhuma mudança chega a produção. O draft permanece disponível para debugging pelo Arquiteto.

---

## Auditoria de Diff Estruturada

Antes da promoção, o Arquiteto/PO revisa o diff completo das mudanças. O formato padrão é **unified diff (git-like)**.

### Exemplo de diff gerado pelo sistema:

```diff
=== [1/2] backend/src/api/auth.js | MODIFIED | small ===
--- a/backend/src/api/auth.js  (sha256:aaa111...)
+++ b/backend/src/api/auth.js  (sha256:ccc333...)
@@ -10,8 +10,10 @@
 const router = express.Router();
 
-router.post('/login', async (req, res) => {
-  const { email, password } = req.body;
+router.post('/auth/login', async (req, res) => {
+  const { email, password } = req.body;
+  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
+  
   try {
     const user = await AuthService.login(email, password);

=== [2/2] backend/src/services/auth-service.js | CREATED | small ===
--- /dev/null
+++ b/backend/src/services/auth-service.js  (sha256:eee555...)
@@ -0,0 +1,15 @@
+const bcrypt = require('bcrypt');
+const jwt = require('jsonwebtoken');
+
+class AuthService {
+  static async login(email, password) {
+    // ...
+  }
+}
```

### Metadados exibidos junto ao diff:

```
📦 Promoção: exec_abc123 → v_2026_03_26_001
📅 Deliberação: 2026-03-26T09:45:00Z
🎯 Master Manifest: confidence=0.96 | risk_score=0.12 | impact_score=0.22
📁 Arquivos na whitelist: 2/2 modificados
✅ Validation Gate: 6/6 checks passed
🔄 Rollback disponível: → v_2026_03_25_003 (25/03 às 14:30)
```

**Extensão futura**: diff semântico via AST (Abstract Syntax Tree), que identifica mudanças de lógica mesmo quando o código foi reformatado ou reorganizado sem mudança funcional.

---

## promote.service — Responsabilidades Detalhadas

O `promote.js` monolítico é substituído por um serviço com 6 funções especializadas, cada uma com responsabilidade única, testável individualmente e com tratamento de erro explícito.

### `preparePromotion(executionId)`
- Lê o manifest de `manifests/{executionId}.json`
- Valida que o estado atual é `DRAFT_READY`
- Copia `draft/{executionId}/` → `staging/{executionId}/`
- Valida cada arquivo copiado contra a `allowed_paths` whitelist
- Atualiza estado: `DRAFT_READY` → `VALIDATING`

### `validateStaging(executionId)`
- Executa os 6 checks do Pre-Promotion Gate contra `staging/{executionId}/`
- Registra resultado de cada check no manifest
- Em caso de falha: remove staging, atualiza estado `VALIDATING` → `FAILED`, preserva draft
- Em caso de sucesso: gera o diff estruturado, atualiza estado `VALIDATING` → `VALIDATED`

### `createRelease(executionId, versionId)`
- Cria o diretório `production/releases/{versionId}/`
- Copia os arquivos do staging para a release (a release é o destino final imutável)
- Cria o backup: `tar -czf backups/{executionId}/files.tar.gz` do estado atual de produção
- Salva o manifest completo em `backups/{executionId}/manifest.json`
- Atualiza estado: `READY_FOR_PROMOTION` → `PROMOTING`

### `atomicSwap(executionId, versionId)`
- Adquire o lock global de promoção (Postgres Advisory Lock)
- Registra a versão anterior em `production/.previous_pointer`
- Executa: `ln -sfn releases/{versionId} production/pointer`
- Verifica que o pointer foi atualizado corretamente
- Libera o lock
- Atualiza estado: `PROMOTING` → `PROMOTED`

### `finalize(executionId)`
- Remove `staging/{executionId}/` (efêmero)
- Marca draft para cleanup em 24h (mantido para auditoria)
- Emite evento de observabilidade: `PROMOTION_COMPLETED`
- Atualiza banco: execution status, `promoted_at`, `version_id`

### `handleFailure(executionId, failureStage)`
- Detecta em qual estágio a falha ocorreu
- Se o swap já foi executado: executa rollback via pointer (`ln -sfn releases/{previous} production/pointer`)
- Se o swap não foi executado: apenas limpa staging e marca como `FAILED`
- Emite evento de observabilidade: `PROMOTION_FAILED` com `failureStage` e stack trace
- Libera o lock global se ainda estiver ativo

---

## Observabilidade da Promoção

Cada evento significativo do fluxo emite um log estruturado, correlacionado por `execution_id` e `version_id`:

```json
{
  "execution_id": "exec_abc123",
  "version_id": "v_2026_03_26_001",
  "stage": "PROMOTION",
  "event": "ATOMIC_SWAP_COMPLETED",
  "timestamp": "2026-03-26T10:02:44.123Z",
  "duration_ms": 12,
  "metadata": {
    "previous_version": "v_2026_03_25_003",
    "files_promoted": 2,
    "lock_held_ms": 45
  }
}
```

### Eventos rastreados:

| Evento | Stage | Descrição |
| :--- | :--- | :--- |
| `DRAFT_WRITE_STARTED` | DRAFTING | Executor iniciou escrita no draft |
| `DRAFT_WRITE_COMPLETED` | DRAFT_READY | Executor sinalizou draft completo |
| `GATE_CHECK_PASSED` | VALIDATING | Um check individual passou |
| `GATE_CHECK_FAILED` | VALIDATING | Um check individual falhou |
| `RELEASE_CREATED` | PROMOTING | Release imutável criada |
| `LOCK_ACQUIRED` | PROMOTING | Lock global de promoção adquirido |
| `ATOMIC_SWAP_COMPLETED` | PROMOTED | Pointer atualizado com sucesso |
| `ROLLBACK_EXECUTED` | ROLLED_BACK | Pointer revertido para versão anterior |
| `PROMOTION_FAILED` | FAILED | Falha antes do swap, nada foi mudado em prod |

### Métricas a rastrear e monitorar:

- **Tempo total de promoção**: `DRAFT_WRITE_STARTED` → `ATOMIC_SWAP_COMPLETED`
- **Taxa de falha no gate**: quantas promoções falham na validação vs. total
- **Rollback rate**: quantas promoções precisam ser revertidas após o swap
- **Tempo médio de validação**: tempo total do Pre-Promotion Gate por check
- **Lock contention**: quantas vezes uma promoção esperou por outra

---

## Políticas Operacionais

Sem políticas de limpeza, o sistema acumula lixo indefinidamente: drafts antigos, stagings abandonados, releases obsoletas e backups que nunca são removidos.

| Recurso | Política de Retenção | Limpeza |
| :--- | :--- | :--- |
| **Releases** | Manter as últimas 20. TTL: 7 dias após ser substituída por nova versão. | Processo cron diário |
| **Backups** | TTL: 30 dias. Auto-removido após confirmação de estabilidade da promoção seguinte. | Processo cron diário |
| **Drafts** | Manter por 24h após `PROMOTED` (para auditoria). Auto-removido após 24h. | Processo de `finalize()` agenda a remoção |
| **Staging** | Sempre efêmero. Removido imediatamente após validação (sucesso ou falha). | `validateStaging()` e `handleFailure()` |
| **Drafts abandonados** | Status `DRAFT_IN_PROGRESS` por mais de 24h → marcados como `DRAFT_EXPIRED`. Cleanup automático em 48h. | Processo watchdog |
| **Manifests** | Manter permanentemente (são a trilha de auditoria). Arquivar em cold storage após 90 dias. | Processo de arquivamento |

---

## Mudanças Necessárias no Código Existente

### [MODIFY] [orchestrator-executor.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/orchestrators/orchestrator-executor.js)

- Implementar o método `_runAction` com lógica real de escrita confinada ao draft
- Adicionar `validatePath()` antes de qualquer operação de escrita
- Adicionar validação de `allowed_paths` contra a whitelist do manifest
- Emitir eventos de observabilidade para cada operação de escrita
- Integrar com a State Machine: atualizar estado `DRAFTING` e `DRAFT_READY`

### [NEW] `scripts/bolt/promote/promote.service.js`

Novo módulo com as 6 funções especializadas (`preparePromotion`, `validateStaging`, `createRelease`, `atomicSwap`, `finalize`, `handleFailure`). Integra com o `GovernanceRepository` para atualização de estado e com o lock global de promoção.

### [MODIFY] [governance-repository.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/repositories/governance-repository.js)

- Adicionar métodos para gerenciar o ciclo de vida da promoção: `updatePromotionStatus`, `getPromotionHistory`, `acquireGlobalPromotionLock`, `releaseGlobalPromotionLock`
- Adicionar a coluna `promotion_status` na tabela `bolt_executions` para rastrear a State Machine de promoção separadamente do status de execução BOLT

---

## Fluxo de Trabalho Completo (End-to-End)

```
1. DELIBERAÇÃO
   DeliberationController → Master Manifest v2.16
   (inclui allowed_paths, execution_guardrails, execution_plan)

2. ESCRITA EM SANDBOX   [Estado: DRAFTING]
   OrchestratorExecutor._runAction()
   → Escreve em draft/{execution_id}/ (paths validados)
   → Sandbox Nível 1: path.resolve + whitelist check
   → Emite DRAFT_WRITE_STARTED

3. DRAFT PRONTO         [Estado: DRAFT_READY]
   → Executor sinaliza conclusão
   → Emite DRAFT_WRITE_COMPLETED

4. PRE-PROMOTION GATE   [Estado: VALIDATING → VALIDATED]
   preparePromotion() → copia draft para staging
   validateStaging() → 6 checks sequenciais
   → Gera diff estruturado para revisão humana
   → Em falha: FAILED. Draft preservado.

5. REVISÃO HUMANA       [Estado: READY_FOR_PROMOTION]
   Arquiteto/PO revisa diff e aprova promoção
   (ou aprovação automática se confidence > threshold)

6. PROMOÇÃO ATÔMICA     [Estado: PROMOTING]
   createRelease() → release imutável criada
   atomicSwap() → ln -sfn com lock global
   → Em falha: ROLLED_BACK. Pointer revertido.

7. CLEANUP              [Estado: PROMOTED]
   finalize() → staging removido, draft agendado para remoção em 24h
   → Logs e métricas emitidos
```

---

## Plano de Verificação

| Teste | O que valida | Como provocar |
| :--- | :--- | :--- |
| **Isolamento de sandbox** | Executor tenta escrever fora do `allowed_paths` → bloqueado | Injetar path não-whitelistado no plano de execução |
| **Path traversal** | Tentar `../../etc/passwd` → `path.resolve()` bloqueia | Passar path malicioso na `_runAction` |
| **E2E Promoção (happy path)** | Draft → staging → swap → estado `PROMOTED` | Executar fluxo completo com manifest válido |
| **E2E Rollback (gate failure)** | Gate falha → staging removido, draft preservado, estado `FAILED` | Injetar test suite que falha propositalmente |
| **E2E Rollback (swap failure)** | Swap executado mas validação pós-swap falha → pointer revertido, estado `ROLLED_BACK` | Simular falha após `atomicSwap()` |
| **Concorrência** | Duas promoções simultâneas → segunda aguarda ou falha com mensagem clara | Lançar dois processos de promoção simultâneos |
| **Cleanup** | Após promoção, staging removido, draft marcado para 24h | Verificar filesystem após fluxo completo |
| **Integridade de manifest** | Hash do arquivo em produção bate com `hash_after` no manifest | Verificar SHA256 do arquivo em `production/releases/` |

---

## Avaliação Técnica (v1 → v2)

| Dimensão | Status v1 | Status v2 |
| :--- | :--- | :--- |
| Direção arquitetural | ✅ Correta | ✅ Reforçada com modelo de releases |
| Atomicidade real | ⚠️ Cópia de arquivo (frágil) | ✅ `rename()` + `ln -sfn` (kernel-level) |
| Rollback confiável | ⚠️ Restore manual com edge cases | ✅ Mudança de ponteiro (instantâneo, sem falha) |
| Controle de concorrência | ❌ Ausente (risco crítico) | ✅ Postgres Advisory Lock |
| Sandbox técnica | ⚠️ Apenas lógica (path prefix) | ✅ 3 níveis: path.resolve → root isolado → container |
| State machine explícita | ❌ Ausente | ✅ 9 estados formais com semântica clara |
| Observabilidade | ⚠️ Mencionada mas não estruturada | ✅ Eventos tipados + métricas definidas |
| Políticas operacionais | ⚠️ Parciais | ✅ Todas as classes de recurso cobertas |
| **Nota Geral** | **7.5 / 10** | **9.5 / 10** |

> O 0.5 restante é a containerização real do executor (Sandbox Nível 3) — que é enterprise e pode ser entregue como evolução futura sem bloquear a implementação inicial.
