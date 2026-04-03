# ✅ Checklist de Construção: Governança AI 10.1 (Spin4All Elite)

Este roteiro guia a implementação técnica de cada componente do protocolo de segurança e controle.

---

## 🧱 Eixo 1: Governança & Determinismo (Controle)
Foco: Impedir que o agente saia do trilho.

- [x] **Setup de Governança**: Criar diretório `backend/src/governance/`.
- [x] **Agent Controller**: Codificar o interceptador que valida o manifesto contra alterações em tempo real.
- [x] **Diff Engine**: Implementar a lógica de classificação de risco e bloqueio de `forbidden_operations`.
- [x] **Plano Antecipado**: Definir o workflow onde o Agente deve escrever o plano técnico antes da execução.
- [x] **Main Orchestrator**: Unificar os gates no script `main.js`.

---

## 🏗️ Eixo 2: Sandbox & Isolamento (Segurança)
Foco: Isolar o rascunho da produção real.

- [x] **Estrutura de Pastas**: Criar `/draft`, `/prod` e `/backup` na raiz do projeto.
- [x] **Isolamento de Infra**: Configurar banco `spin4all_test` e garantir que o `/draft` aponte para ele.
- [x] **Promote.js**: Codificar o script de promoção com:
    - [x] Snapshot automático da produção.
    - [x] **Promoção Seletiva (Overlay)**: Proteção contra deleção de módulos terceiros (Ex: Monitoramento AI).
    - [x] Validação de Hash SHA-256 entre Draft e Produção.
    - [x] Lógica de Rollback em caso de erro de integridade.

---

## 🧪 Eixo 3: Pipeline de Testes (Validação)
Foco: Garantir que o código do rascunho é seguro para ser promovido.

- [ ] **Playwright Setup**: Configurar testes de fumaça (Login, Dashboard, Limpeza).
- [x] **Schema Validation**: Implementar validação de retorno de API via AJV para evitar quebras de JSON no frontend.
- [x] **Health Check Estendido**: Validar todos os endpoints críticos do manifesto.

---

## 📊 Eixo 4: Observabilidade Industrial (Visibilidade)
Foco: Rastreabilidade total da ação do agente.

- [x] **Refatoração de Logs**: Portar o sistema para Winston com injeção automática de `ExecutionID`.
- [x] **CorrelationID**: Implementar injeção de ID de execução em todos os logs de sub-componentes.
- [x] **Log Estruturado**: Saída em formato JSON para auditoria industrial.

---

## 🚀 Próximo Passo Sugerido:
Iniciar o **Eixo 1 (Governança)** com a criação do `agent-controller.js` e do template de `TASK_MANIFEST.json`.
