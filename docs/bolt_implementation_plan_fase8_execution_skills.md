# BOLT Fase 8: Execution Skills (Especialistas de Elite) — Refinamento Industrial Supremo

Este plano formaliza o **Passo 43** do Protocolo BOLT: a criação das **Execution Skills**. O objetivo é transformar o agente de um executor genérico em especialistas segregados (Frontend, Backend e DB), regidos por uma camada de inteligência operacional que garante rastreabilidade total, segurança inegociável e excelência estética.

---

## 🎯 Objetivos Estratégicos (V8.2 Elite)
1.  **Imutabilidade do Comportamento**: Versionar as skills para garantir que a inteligência seja estável e auditável.
2.  **Orquestração por Contrato**: Definir envelopes de input e output rígidos para eliminar a ambiguidade.
3.  **Blindagem Constitucional**: Hierarquia de prompts onde a segurança do sistema (CORE) sempre vence o desejo do usuário.
4.  **Conformidade Autônoma & Explicável**: Auditoria via Compliance Score com breakdown detalhado e escala dinâmica de exigência.

---

## 🏗️ Proposta de Arquitetura Industrial (O Cerebelo do BOLT)

As skills e sua gestão residirão no diretório `backend/src/governance/skills/`.

### 1. Versionamento & Identidade (The Skill Manifest)
Cada skill será tratada como um módulo versionado e imutável:
- `manifest.json`: Contém `version`, `hash` (checksum do `system.txt`) e `last_updated`.
- `system.txt`: A instrução de sistema especialista (Instrução em PT | Código em EN).
- `input_schema.json` / `output_schema.json`: Contratos de interface rígidos.

### 2. Execution Context Envelope (A Caixa Preta) ✉️
Padronização do objeto de entrada consolidado para garantir rastreabilidade ponta a ponta:
```json
{
  "execution_id": "uuid",
  "skill": "backend",
  "skill_version": "1.0.0",
  "input_payload": {...},
  "constraints": {...},
  "metadata": { "timestamp": "...", "origin": "orchestrator" }
}
```

### 3. Hierarquia de Autoridade (Constituição Digital) 🛡️
Camadas de isolamento de instrução com prioridade explícita:
1.  **[0] CORE GUARD**: Regras constitucionais de segurança e sandbox.
2.  **[1] SKILL LAYER**: Padrões técnicos do especialista.
3.  **[2] TASK CONTEXT**: O plano de execução (Manifesto v2.16).
4.  **[3] USER INPUT**: Customizações específicas (menor prioridade).

---

## ⚙️ Especialistas Especializados

### 1. 🎨 Frontend Skill (The Visual Guardian)
- **Instruções**: HTML5 Semântico, Vanilla CSS puro, Glassmorphism, Micro-interações.
- **Pragmatismo**: "Vanilla por Padrão, Override Controlado".
- **Tokens**: Injeção direta de variáveis do `UI_Style_Guide_Elite.md`.

### 2. ⚙️ Backend Skill (The Logic Architect)
- **Instruções**: Clean Architecture, tratamento de erros centralizado (AggregateError), logger-bolt obrigatório.

### 3. 🗄️ DB Skill (The Data Guardian)
- **Instruções**: PostgreSQL, Migrações incrementais, integridade referencial.

---

## 🛠️ Plano de Ação (Fluxo Linear)

### Etapa 1: Infraestrutura de Gestão & Inteligência
- **[NEW] skill-manifest-schema**: Padrão de JSON para identidade de skills.
- **[NEW] skill-resolver.js (Estratégico)**: Lógica híbrida (Regra + LLM) para seleção de skills, suportando **Composição Multi-Skill** (ex: Backend + DB simultâneo).
- **[NEW] skill-loader.js**: Carregador com validação de checksum e injeção do Context Envelope.

### Etapa 2: Implementação dos Especialistas (system.txt)
- Criação das instruções baseadas nas versões estáveis do Guia de Estilo e Padrões de API.

### Etapa 3: Integração & Orquestração
- **[MODIFY] orchestrator-executor.js**: Injeção da hierarquia de prompts e implementação do **Retry Strategy** com limite de 3 tentativas e escala para intervenção humana em caso de falha persistente.

---

## 🧪 Verificação, Compliance & Auto-Cura

### 1. Compliance Score Explicável (Breakdown) 📊
A auditoria automatizada gerará um laudo detalhado:
```json
{
  "score": 0.87,
  "breakdown": {
    "architecture": 0.9,
    "logging": 0.6,
    "security": 1.0
  },
  "decision_log": ["Destaque: Falta import do logger na linha 15"],
  "violations": ["missing_logger"]
}
```

### 2. Escala Dinâmica de Exigência (Gating)
- **Early Phase (Agora)**: 0.85 - 0.9 (Permite evolução sem bloqueios excessivos).
- **Stable Phase**: 0.9 (Padrão ouro de produção).
- **Critical Phase**: 0.95+ (Missão crítica / Produção).

---

> [!IMPORTANT]
> **User Review Consolidado**:
> 1. A mudança de `auditory_logs` para **`decision_log`** foi aplicada para clareza semântica.
> 2. O limite de **Retry em 3 tentativas com Escala Humana** está configurado para proteger a eficiência da operação.
> 3. A hierarquia de prompts com **CORE > USER** está blindada.
