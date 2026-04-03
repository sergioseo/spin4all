# ⚡ Estrutura Detalhada do Protocolo BOLT

O **Protocolo BOLT (Elite AI Governance)** é o sistema de governança industrial do projeto **Spin4all**. Ele representa a evolução do protocolo TICO, focando na segregação de responsabilidades entre agentes especializados e execução determinística em sandbox.

---

## 🏗️ 1. Núcleo de Governança (`backend/src/governance/`)

Este é o "cérebro" do protocolo, onde reside a lógica de orquestração e as instruções dos agentes.

### Arquivos Principais
- **[main.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/main.js)**: Ponto de entrada para disparar o ciclo BOLT.
- **[bolt-runner.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/bolt-runner.js)**: Motor principal que executa a esteira de skills.
- **[agent-controller.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/agent-controller.js)**: Controlador de permissões e escopo de escrita (Read-Only/Write-Lock).
- **[promote.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/promote.js)**: Script responsável pela promoção atômica do `/draft` para o ambiente ativo.
- **[diff-engine.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/diff-engine.js)**: Motor de comparação para validar alterações antes da promoção.
- **[test-runner.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/test-runner.js)**: Validador de integridade pós-execução (Smoke Tests).

### Subdiretórios
- **/skills/**: Contém a definição de cada "especialista" da esteira.
  - Cada pasta (`architect`, `backend`, `classifier`, `context_scanner`, `db`, `frontend`, `po`) contém:
    - `system.txt`: Instruções de sistema (System Prompt) do agente.
    - `input.json`: Contrato de entrada (O que o agente deve processar).
    - `output.json`: Resultado da deliberação do agente.
- **/orchestrators/**: Lógicas complexas de coordenação entre múltiplas skills.
- **/contracts/**: Templates e validações de contratos técnicos.
- **/schemas/**: Definições JSON Schema para garantir que as saídas dos agentes sejam válidas.
- **/logs/**: Auditoria completa de cada execução (ExecutionID / CorrelationID).

---

## 🧪 2. Sandbox e Ambiente de Execução (`scripts/bolt/`)

O BOLT opera sob o princípio de **Isolamento de Escrita**. Nada é alterado diretamente em produção sem passar pela Sandbox.

### Estrutura Física
- **[/draft](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/scripts/bolt/draft/)**: Onde o código é efetivamente gerado ou modificado pelos agentes.
- **[/staging](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/scripts/bolt/staging/)**: Área de pré-lançamento para validação de SHA-256 e testes E2E.
- **[/releases](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/scripts/bolt/releases/)**: Repositório imutável contendo o histórico das últimas versões estáveis.
- **[current](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/scripts/bolt/current)**: Atalho (Symlink/Junction) que aponta para a release ativa em uso pelo sistema.
- **/locks/**: Controle de concorrência para evitar que dois agentes escrevam simultaneamente.
- **/backlogs/**: Fila de tarefas pendentes aguardando processamento.

---

## 📜 3. Manifestos e Metadados (Raiz do Projeto)

O estado da execução é rastreado por arquivos de controle na raiz.

- **[TASK_MANIFEST.json](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/TASK_MANIFEST.json)**: Arquivo central que define o "Passaporte" da tarefa atual (Status, Escopo, Arquivos Afetados).
- **[governance.log](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/governance.log)**: Log de auditoria em tempo real de todas as ações de escrita.

---

## 📚 4. Documentação de Suporte (`docs/`)

Arquivos que definem as regras teóricas e o roadmap do protocolo.

- **[BOLT_Estrutura_do_Protocolo.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/docs/BOLT_Estrutura_do_Protocolo.md)**: Visão geral da filosofia BOLT.
- **[BOLT_Papeis_Camada_Deliberacao.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/docs/BOLT_Papeis_Camada_Deliberacao.md)**: Detalhamento dos papéis (PO vs Architect).
- **[BOLT_vs_TICO_Arquitetura.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/docs/BOLT_vs_TICO_Arquitetura.md)**: Comparativo de evolução técnica.
- **[BOLT_Histórico_Estratégia_Log.md](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/docs/BOLT_Histórico_Estratégia_Log.md)**: Log de decisões estratégicas de arquitetura.

---

## 🔄 Fluxo de Operação (Resumo)

1. **Classifier** identifica a intenção no input do usuário.
2. **PO & Architect** deliberam no `/backend/src/governance/skills` gerando contratos técnicos.
3. **Execution Skills** escrevem o código na Sandbox `/scripts/bolt/draft`.
4. **QA Validator** roda testes via `test-runner.js`.
5. **Promote** move o código validado para `/scripts/bolt/releases` e atualiza o link `current`.
