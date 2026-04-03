# [PLAN] Fase 9: QA Validator (Health Check) — Refinamento v9.8 🛡️📐🧬🏗️

Este documento consolida a arquitetura final do **QA Validator**, transformando-o no **Guardião Supremo da Governança Industrial** do projeto Spin4all. O sistema agora atua não apenas como um filtro de erros, mas como um sensor de qualidade estrutural, proativo e autônomo.

> [!CAUTION]
> **ESTADO DE REFINAMENTO**: Este plano representa a versão final de design v9.8. Nenhuma implementação deve ser iniciada sem a validação formal do Comandante.

---

## 1. Arquitetura Estrutural (AST & Adapters)
Para garantir precisão cirúrgica, o QA Validator abandona regex simples e adota análise gramatical profunda.

### [Componente] QA Validator Service
#### [NEW] [qa-validator/](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/services/qa-validator/)
- **`core.js`**: Cérebro central que identifica extensões e orquestra a validação.
- **`adapters/`**: Especialistas baseados em **AST (Abstract Syntax Tree)**.
  - `js-adapter.js`: Validação estrutural profunda (ex: `acorn`).
  - `css-adapter.js`: Validação de árvore gramatical e design tokens.
  - `sql-adapter.js`: (Futuro) Validação semântica e sintática.

### [NEW] Auto-Fix Engine (Eficiência de Tokens)
O sistema terá capacidade de **Reparo Determinístico**. 
- Erros triviais (ex: fechar chaves, ponto-e-vírgula ausente) serão corrigidos automaticamente pelo QA.
- Isso reduz a latência de redeliberação da IA e economiza custos operacionais.

---

## 2. Métrica de Saúde Ponderada (Health Score)
A saúde do código passa a ser calculada com base no **Risco Operacional**.

### [NEW] Cálculo de Pesos (Weights):
O `Health Score` (0.0 a 1.0) será ponderado conforme a categoria:
- **Syntax (50%)**: A base funcional. Sem ela, nada funciona.
- **Security (30%)**: Proteção contra caminhos absolutos e injeções.
- **Style (20%)**: Conformidade com o **Style Guide Elite**.

**Equação**: `Score = (Syntax * 0.5) + (Security * 0.3) + (Style * 0.2)`

### [NEW] QA Policy (Gatilhos de Bloqueio):
Configurações injetáveis via `qa_policy.json`:
- `fatal_threshold`: 1 (Qualquer erro fatal bloqueia).
- `warning_threshold`: 3 (Atingir 3 inconsistências bloqueia).
- `min_health_score`: 0.90 (Nota mínima para promoção automática).

---

## 3. Cultura de Voo (Modos de Rigor)
O QAValidator passará a respeitar o **Modo de Execução** da missão:
- **Strict (Produção)**: Bloqueio total se `Score < 0.95`.
- **Relaxed (Desenvolvimento)**: Promove com `Score > 0.7` enviando avisos ao log.
- **Exploratory (Debug)**: Apenas diagnósticos informativos, sem vetos.

---

## 4. Adapters Específicos & Guardrails Semânticos 🔐
Evolução da validação de "sintaxe" para "intenção segura".

### [NEW] SQL Guardrails (Mandatórios):
- Bloqueio de `UPDATE` ou `DELETE` sem cláusula `WHERE`.
- Bloqueio de comandos DDL (`DROP`, `TRUNCATE`) sem autorização explícita no Manifesto.

### [NEW] Multi-file Context:
- O QA verificará se o novo código quebra contratos (imports/exports) de arquivos já existentes no diretório `current`.

---

## 5. Integração e Auto-Cura (Self-Correction Loop) 🔁
O QAValidator alimenta diretamente o motor de retries da IA.
1. Se o score for insuficiente, o diagnóstico é enviado de volta para o `OrchestratorExecutor`.
2. A IA recebe o erro exato e realiza o **Auto-Retry** para correção imediata.

---

## 6. Reporting & Rastreabilidade (Versionamento)
- **Console (Resumo)**: Exibição rápida: `QA v1.0.0: ⚠️ Score 0.85 (2 warnings)`.
- **Log Industrial**: Objeto `HealthDiagnosis` completo persistido para auditoria.
- **[NEW] QA Versioning**: Cada promoção registra a `qa_version` ativa para manter a fidelidade histórica das regras de qualidade.

---

## 7. Próximas Alterações (Refinadas)

### [MODIFY] [bolt-runner.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/bolt-runner.js)
Injeção de `[STAGE 2.5] QA_HEALTH_CHECK` sustentado por `QAValidator`.

### [MODIFY] [logger-bolt.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/utils/logger-bolt.js)
Inclusão de campos de audit score e versão do motor de QA.

---

## 8. Plano de Verificação (Fim-a-Fim)

### Automated Tests
- Teste de **Bloqueio Fatal**: Erro de sintaxe → Promoção Abortada.
- Teste de **Auto-Fix**: Falta de `;` → Arquivo corrigido e Promovido.
- Teste de **Design Check**: CSS sem tokens de elite → Alerta de Warning.

### Manual Verification
- Auditoria do `Health Score` no Dashboard do Notion após o deploy real.
