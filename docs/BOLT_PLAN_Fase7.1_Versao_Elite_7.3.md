# 🛰️ BOLT: Plano de Implementação Fase 7 — Sandbox & Promoção Industrial (v7.3 Elite)

Este documento estabelece o protocolo de "Artilharia Pesada" para a transição do BOLT para escrita de código real. O foco é a **Resiliência Atômica**, **Segurança de Sandbox** e **Observabilidade de Produção**.

---

## 🧭 1. Visão Geral e Objetivos
A Fase 7 marca a autonomia física do protocolo BOLT. O objetivo é permitir que o Agente escreva, valide e promova código para produção com garantias que superam o erro humano, utilizando um sistema de **Promoção Transacional** baseado em **Checkpoints e Atomic Swaps**.

---

## 🏗️ 2. Arquitetura de Diretórios (Fundação Física)
Para garantir isolamento, o sistema opera em uma estrutura de diretórios segregada e protegida.

### 📁 Estrutura de Pastas (Base: `/scripts/bolt/`)
- **`/draft/{execution_id}/`**: Workspace de escrita inicial. O Agente só tem permissões de I/O aqui.
- **`/staging/{execution_id}/`**: Workspace de validação e testes pré-produção. Clone do draft para auditoria.
- **`/releases/{timestamp}/`**: Armazenamento imutável das últimas versões promovidas com sucesso.
- **`/current`**: Junction (Windows) / Symlink (Linux) que aponta para a release ativa.
- **`/locks/`**: Arquivos de lock e controle de concorrência local.

> [!TIP]
> **Idempotência de Setup**: O script `setup-industrial-folders.js` utiliza criação recursiva e verificações de existência, permitindo reinicializações do sistema sem corromper dados existentes.

---

## 🛡️ 3. Camada de Segurança e Hardening (Sandboxing)
O isolamento não é apenas lógico, é verificado fisicamente em tempo real.

### Verificação de Caminhos (Sandbox Validator)
- **Prevenção de Path Traversal**: Uso obrigatório de `fs.realpathSync(target)` para garantir que resoluções de `../` não "escapem" da raiz da sandbox.
- **Whitelist Baseada no Manifesto**: O Agente só pode afetar arquivos explicitamente autorizados na seção `impact_scope` do Manifesto v2.16.

---

## ⚙️ 4. O Motor de Promoção (Promote Service)
O serviço central que coordena a transição de estados e garante a integridade dos dados.

### 🔄 State Machine de 9 Estados (Imutável)
Transições válidas para garantir a integridade da jornada:
`PREPARING` → `SYNCHRONIZING` → `VALIDATING` → `COMMITTING` → `SWAPPING` → `VERIFYING` → `LIVE` | `FAILED` → `ROLLING_BACK`.

### 📋 Validação via Manifesto (Reconciliation Loop)
- **Checksum Global**: Antes do swap de ponteiro, o sistema gera um fingerprint SHA-256 de toda a pasta `/staging`.
- **Reconciliação**: A promoção é abortada se o fingerprint não coincidir exatamente com o esperado no Manifesto deliberado.

---

## ⚡ 5. Atomicidade e Controle de Concorrência
Garantia de que o sistema nunca fique em estado inconsistente ("meia-promoção").

### 🏗️ Atomic Swap via Directory Junction
- No Windows, utilizamos `mklink /J` para atualizar o ponteiro `/current`.
- **Zero Trust Post-Swap**: Validação imediata após o comando: `fs.realpathSync('/current') === expectedRelease`. Se falhar, o sistema dispara um **Hard Abort**.

### 🔒 Lock Global de Promoção
- **PostgreSQL Advisory Locks**: Serialização mundial das promoções via `pg_advisory_lock(941183)`. Impede que dois processos tentem atualizar o ponteiro `current` simultaneamente.

---

## ⚖️ 6. Guardrails Dinâmicos e Governança
Limites configuráveis para evitar alucinações de larga escala.

- **Hard Limits Padrão**:
    - `MAX_FILES_CHANGED = 20`
    - `MAX_TOTAL_DIFF_SIZE = 100 KB`
- **Execution Profiles**: Diferenciação de limites entre "Refatoração Agencial" e "Manutenção Admin" (Override autorizado por Role).

---

## 🔍 7. Observabilidade e Retenção Forense
O BOLT não pode ser uma caixa preta.

### 📉 Política de Retenção (Regra 5+1)
- **Releases**: Mantemos as últimas **5 releases estáveis** no disco para rollback manual ou automático.
- **TTL de Draft (Forense)**: Pastas de `/draft` e `/staging` são mantidas por **1 hora** (TTL) após a promoção (mesmo em sucesso) para permitir auditoria imediata.

### 📝 Tracing Estruturado (JSON)
- Integração do `logger-bolt.js`: Logs estruturados contendo `execution_id`, `state`, e `step_order`. Facilita o monitoramento em dashboards.

---

## 🧪 8. Plano de Verificação (Stress & Crisis)
Protocolos para garantir que o sistema sobreviva ao pior cenário.

- **Race Condition Check**: Teste de concorrência forçada entre dois processos de promoção.
- **Junction Failure Simulation**: Simulação de erro de permissão no momento do `swap` para validar a reversão de estado.
- **Integridade de Hash**: Injeção de arquivo extra em staging para validar se o Checksum bloqueia a promoção.

---

## 🛣️ 9. Roadmap de Longo Prazo
- **OS-Level Isolation**: Evolução da sandbox atual (lógica/física) para containers **Docker** ou **Micro-VMs** (Firecracker) no futuro.
