# Integração Técnica: Execution Skills no Orquestrador (V8.3 Elite) — Consolidação Final

Este documento formaliza a integração das **Execution Skills** no núcleo do `orchestrator-executor.js`. Ele define como o orquestrador deixa de ser um motor de escrita passivo e se torna um **Processador de Contexto Resiliente**, capaz de coordenar múltiplos especialistas sob governança rígida.

---

## 🏗️ 1. Arquitetura de Orquestração (O Motor de Decisão)

### Composição de Inteligência (Multi-Skill Stack) 📦
Em vez de uma única skill, o orquestrador agora suporta a **Pilha de Especialistas**:
- O `SkillResolver` identifica todas as especialidades necessárias (ex: Backend + DB).
- O orquestrador realiza o **Prompt Merge Controlado**, injetando as instruções de ambos os especialistas no fluxo de geração.
- Em caso de conflito, a prioridade é definida no Manifesto da Skill (ex: DB Core > Backend Logic).

### Estratégia de Resiliência (Self-Correction Loop) 🔁
O sistema não para na falha; ele aprende e tenta novamente:
- **Max Retries**: 2 tentativas automáticas.
- **Fluxo de Recuperação**: Se `Compliance Score < threshold`, o orquestrador envia o **Breakdown de Violações** de volta para a IA como instrução de correção para a nova tentativa.
- **Escala Humana**: Se falhar após 2 retries, a execução trava e solicita revisão manual.

---

## 🛡️ 2. Governança e Blindagem (The Execution Envelope)

### ✉️ Envelope de Contexto Ativo
O envelope deixa de ser um objeto passivo e passa a ser o **Prefixador de Realidade** da IA. Cada prompt enviado será encapsulado:
```json
{
  "execution_id": "uuid",
  "skill_stack": ["backend@1.0.0", "db@1.0.0"],
  "constraints": "Strict Mode (Rule-based)",
  "origin": "BOLT_Core_v7.3"
}
```

### 🔐 Privilégio Mínimo (Sandbox Boundaries)
Cada skill possui um escopo de permissões no seu `manifest.json`:
- **Frontend Skill**: Read/Write apenas em `/frontend/src` e `/public`.
- **Backend Skill**: Read/Write em `/backend/src`. Proibido acesso a `/config/secrets`.
- **DB Skill**: Permissão exclusiva para `/database/migrations`.

### 📊 Compliance Transparente (Audit Feedback)
A auditoria retorna um laudo estruturado que alimenta o loop de log e retry:
```json
{
  "score": 0.82,
  "breakdown": { "architecture": 0.9, "logging": 0.4, "security": 1.0 },
  "violations": ["missing_jsdoc_on_service_method"],
  "decision_log": ["Rejeitado: Falta documentação obrigatória na Skill Backend"]
}
```

---

## 🛠️ 3. Implementação no Orquestrador (`_runAction`)

O novo fluxo no `orchestrator-executor.js` seguirá esta linha industrial:

1.  **IDENTIFY**: `skillResolver.resolve(scope)` -> Retorna lista de skills.
2.  **VALIDATE**: `skillLoader.load(skillStack)` -> Valida Checksum de cada uma.
3.  **EXECUTE (Loop)**:
    -   Monta Prompt (Core + Skills + Manifesto + Envelope).
    -   Gera/Escreve no `/draft`.
    -   Avalia Score.
    -   Se Score falhar -> Dispara **Self-Correction** com laudo de erro.
4.  **LOG**: Registra `skill_activation`, `version_used` e `compliance_report` via `logger-bolt`.

---

## 🧪 4. Plano de Verificação de Estresse
Para garantir que o sistema é industrial, testaremos os edge-cases:
*   **Impasse de Compliance**: Forçar erro de JSDoc e verificar se o Retry 1 corrige sozinho.
*   **Violação de Fronteira**: Tentar fazer a Frontend Skill escrever no Banco e verificar o bloqueio automático.
*   **Multi-Task**: Criar um componente e sua tabela de banco simultaneamente e validar o merge de instruções.

---

> [!IMPORTANT]
> **User Review Consolidado**:
> 1. O **Compliance Breakdown** será o coração do nosso loop de auto-cura.
> 2. O **Privilégio Mínimo** por skill blinda o sistema contra alucinações de escrita em diretórios errados.
> 3. O **Logging de Especialidade** garante auditoria industrial de "quem fez o quê".
