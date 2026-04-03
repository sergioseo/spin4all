# 🛰️ TICO --- Checklist Executável por Fase

## 🎯 Objetivo

Checklist técnico acionável para execução no Antigravity com controle,
validação e baixo risco.

------------------------------------------------------------------------

# 🧱 FASE 0 --- PREPARAÇÃO

## Tasks

-   [ ] Criar diretórios: /skills, /contracts, /orchestrator, /logs,
    /tests
-   [ ] Definir padrão global de JSON (input/output)
-   [ ] Implementar logger com ExecutionID + CorrelationID
-   [ ] Configurar ambiente draft isolado

## Critérios de aceite

-   Estrutura criada
-   Logs funcionando
-   Execução básica sem erro

------------------------------------------------------------------------

# 🟢 FASE 1 --- FRONTEND SKILL

## Tasks

-   [ ] Criar /skills/frontend.prompt
-   [ ] Definir input/output JSON
-   [ ] Integrar com manifesto automático
-   [ ] Testar alteração simples (botão/UI)

## Critérios de aceite

-   Alteração aplicada corretamente
-   Nenhuma violação de escopo
-   Diff validado

------------------------------------------------------------------------

# 🔵 FASE 2 --- CLASSIFIER

## Tasks

-   [ ] Criar /skills/classifier.prompt
-   [ ] Implementar função classifyTask()
-   [ ] Mapear intents → skills

## Testes

-   [ ] 10 inputs variados
-   [ ] Medir assertividade

## Critérios de aceite

-   ≥ 80% precisão
-   fallback definido

------------------------------------------------------------------------

# 🟡 FASE 3 --- PO

## Tasks

-   [ ] Criar /skills/po.prompt
-   [ ] Definir estrutura de tasks
-   [ ] Garantir output estruturado

## Critérios de aceite

-   Tasks claras
-   Sem ambiguidade
-   Sem execução direta

------------------------------------------------------------------------

# 🟣 FASE 4 --- ARCHITECT

## Tasks

-   [ ] Criar /skills/architect.prompt
-   [ ] Definir contrato padrão (API/UI)
-   [ ] Validar dependências

## Testes

-   [ ] Caso com conflito front/back
-   [ ] Caso com contrato incompleto

## Critérios de aceite

-   Bloqueia inconsistências
-   Gera contrato válido

------------------------------------------------------------------------

# 🔴 FASE 5 --- ORCHESTRATOR

## Tasks

-   [ ] Criar /orchestrator/planning_orchestrator.js
-   [ ] Integrar PO + Architect
-   [ ] Resolver conflitos simples

## Critérios de aceite

-   Output com:
    -   tasks
    -   contratos
    -   dependências

------------------------------------------------------------------------

# 💬 FASE 6 --- DELIBERATION LAYER

## Tasks

-   [ ] Implementar deliberation_log
-   [ ] Salvar decisões e resumo
-   [ ] Exibir no console/log

## Critérios de aceite

-   Decisões rastreáveis
-   Log estruturado

------------------------------------------------------------------------

# 🔄 FASE 7 --- SYNC LAYER

## Tasks

-   [ ] Criar estrutura de comunicação front/back
-   [ ] Definir limite de interações (máx 3)
-   [ ] Implementar fallback → Architect

## Testes

-   [ ] conflito de tipo de dado
-   [ ] dúvida de contrato

## Critérios de aceite

-   Sem loops
-   Resolve inconsistências simples

------------------------------------------------------------------------

# 🔍 FASE 8 --- QA VALIDATOR

## Tasks

-   [ ] Criar /skills/qa.prompt
-   [ ] Validar contrato (AJV)
-   [ ] Validar comportamento

## Testes

-   [ ] mismatch de campo
-   [ ] fluxo incompleto

## Critérios de aceite

-   Bloqueia erro real
-   Aprova fluxo correto

------------------------------------------------------------------------

# 🧪 FASE 9 --- TESTES (AI STUDIO)

Para cada skill:

## Tasks

-   [ ] 5 inputs básicos
-   [ ] 5 variações semânticas
-   [ ] 5 edge cases
-   [ ] 5 violações

## Critérios de aceite

-   Output consistente
-   JSON válido sempre

------------------------------------------------------------------------

# 🧠 GOVERNANÇA GLOBAL

## Regras obrigatórias

-   [ ] Toda skill tem contrato JSON
-   [ ] Toda execução gera manifesto
-   [ ] Logs obrigatórios
-   [ ] QA antes de promote

------------------------------------------------------------------------

# 🚀 CHECK FINAL

-   [ ] Pipeline completo funcional
-   [ ] Nenhuma etapa manual crítica
-   [ ] Logs rastreáveis
-   [ ] Rollback testado

------------------------------------------------------------------------

# 🏁 RESULTADO

Sistema pronto para:

-   execução confiável
-   integração consistente
-   evolução escalável
