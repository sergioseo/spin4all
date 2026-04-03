# 🛰️ TICO — Atualização de Plano (System Instructions + Prompt Layer)

## 🔎 Diagnóstico

Os planos atuais contemplam:
- Estrutura de skills
- Contracts (input/output)
- Pipeline de execução

Porém NÃO contemplam explicitamente:
- System Instructions como artefato versionado
- Input model como camada formal
- Separação clara entre:
  - behavior (system)
  - execution (input)
  - validation (contract)

---

## ❗ GAP IDENTIFICADO

Hoje:
/skills/frontend.prompt (implícito)

Deveria ser:
/skills/frontend/
  ├── system.v1.txt
  ├── input.v1.json
  ├── output.v1.json
  ├── tests/
  └── manifest.json

---

## 🧠 NOVA CAMADA: PROMPT ARCHITECTURE

### 1. SYSTEM INSTRUCTIONS (OBRIGATÓRIO)

- Define comportamento da skill
- Não depende do input
- Versionado

Checklist:
- [ ] Criar system.v1.txt
- [ ] Versionar
- [ ] Testado no AI Studio

---

### 2. INPUT MODEL (OBRIGATÓRIO)

- Define estrutura do request
- Evita ambiguidade

Checklist:
- [ ] Criar input.v1.json
- [ ] Validar schema
- [ ] Testar edge cases

---

### 3. OUTPUT CONTRACT (JÁ EXISTENTE)

- Validado via QA

---

## 🔄 ATUALIZAÇÃO DAS FASES

### FASE 1 — FRONTEND (ATUALIZADO)

Adicionar:

- [ ] Criar system.v1.txt
- [ ] Criar input.v1.json
- [ ] Separar prompt de execução
- [ ] Versionar artefatos

---

### FASE 2+ (TODAS AS SKILLS)

Adicionar para TODAS:

- [ ] system instructions versionadas
- [ ] input model definido
- [ ] separação system vs input

---

## 🧠 GOVERNANÇA ATUALIZADA

Novas regras:

- Nenhuma skill sem system instructions
- Nenhuma skill sem input model
- Prompt NÃO pode ficar inline
- Tudo versionado

---

## 🚀 RESULTADO

Sistema passa a ter:

- Execução determinística
- Baixa alucinação
- Alta rastreabilidade
- Facilidade de QA

---

## 📌 CONCLUSÃO

O plano original é sólido, mas estava incompleto na camada de comportamento.

Essa atualização transforma:

prompt → artefato governado
