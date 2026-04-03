# ⚡ Protocolo BOLT (Elite AI Governance)

O **Protocolo BOLT** é o sucessor evolutivo do TICO. Ele herda 100% da solidez e determinismo do TICO v10.1, mas introduz uma **Esteira de Deliberação Multi-Agente** para elevar a precisão da execução ao nível máximo.

---

## 🎯 Princípios Fundamentais
1.  **Base TICO**: Toda a governança de manifestos e proteção de escopo do TICO é preservada.
2.  **Skill-Segregation**: Cada fase do processo é cuidada por um agente especialista com sua própria `System Instruction`.
3.  **Contract-First**: Nenhuma linha de código é alterada sem um contrato técnico (`input.json`) validado.
4.  **Deliberation-Driven**: A convergência entre o que o negócio quer (PO) e o que o sistema permite (Architect) é resolvida em uma camada de sincronização antes da execução.

---

## 🧱 A Esteira BOLT (Pipeline de Skills)

```txt
[User Input] 
      ↓
1. 🔍 CLASSIFIER SKILL (Elite v1.1)
   - **Papel**: Portão de entrada e roteador de intenções.
   - **Categorias**: `ui_change`, `backend_change`, `fullstack`, `analysis`, `question`.
   - **Mandato**: Gerar `ExecutionID` e fornecer `reason` para cada decisão.
      ↓
2. 📝 PO SKILL (Mestre de Requisitos)
   - **Papel**: Eliminar ambiguidade e definir escopo claro.
   - **Mandato**: Gerar `open_questions` para alinhar expectativas com o usuário.
      ↓
3. 📐 ARCHITECT SKILL (Arquiteto de Soluções)
   - **Papel**: Transformar requisitos em Contratos Técnicos (`TECHNICAL_CONTRACT`).
   - **Mandato**: Definir APIs, Schemas e componentes de UI isolados.
      ↓
4. 🔍 CONTEXT SCANNER (Exploração de Legado)
   - **Papel**: Mapear o código existente e identificar conflitos ou reuso.
   - **Mandato**: Alertar o Arquiteto sobre impedimentos técnicos.
      ↓
5. 💬 DELIBERATION LAYER (Sincronia PO ↔ Architect v2.16)
   - **Papel**: Camada de convergência e resolução de restrições.
   - **Mecânica**: Rodadas de ajuste entre Valor (PO) e Viabilidade (Architect).
   - **Métricas**: Inteligência preditiva unificando `confidence`, `risk` e `impact`.
   - **Mandato**: Gerar o **Master Manifest Platinum** com o `execution_plan` industrial.
      ↓
6. ⚙️ EXECUTION SKILLS (Especialistas: Frontend / Backend / DB)
   - **Papel**: Agentes especializados regidos por `system.txt` individuais.
   - **Isolamento**: Operam exclusivamente na Sandbox `/draft`.
   - **Mandato**: Executar o `execution_plan` com fidelidade absoluta ao contrato.
      ↓
7. 🔍 QA VALIDATOR (Verifica o Resultado Final)
   - **Papel**: Auditor de integridade pós-escrita.
   - **Mandato**: Validar Checksums, rodar Smoke Tests e dar o "Green Light".
      ↓
8. [🚀 PROMOTE / DEPLOY]
   - **Papel**: Promoção atômica para produção.
   - **Mecânica**: Sandbox → Staging → Junction Swap (Atomic).
```

---

## 🧠 Arquitetura de Artefatos

O BOLT organiza cada Skill em diretórios estruturados:
- `system.txt`: O comportamento versionado do especialista.
- `input.json`: O contrato de entrada (O que fazer).
- `output.json`: O contrato de saída (O que foi feito).

---

## 🛡️ Camada de Segurança (Legacy TICO)
O BOLT utiliza as ferramentas validadas do TICO para proteção física:
- [agent-controller.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/agent-controller.js): Bloqueio de escrita fora de escopo.
- [TASK_MANIFEST.json](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/TASK_MANIFEST.json): O passaporte de execução.
- `governance.log`: Rastreabilidade industrial.

---

## 🏗️ Infraestrutura de Suporte (Legado TICO de Elite)

O BOLT possui uma **fundação física industrial** para garantir que a deliberação se transforme em código seguro.

### 1. Sandbox & Isolamento (Draft)
- **Draft Environment**: O motor BOLT opera exclusivamente no diretório `/draft` durante a execução.
- **Banco de Dados Isolado**: Utiliza `spin4all_test` e instâncias separadas no Redis.
- **Data Reset**: Ambiente restaurado automaticamente a cada ciclo.

### 2. Pipeline de Testes Determinístico
- **UI Smoke Tests (Playwright)**: Validação visual automática dos fluxos críticos.
- **API Integrity**: Sensor que bloqueia qualquer resposta não-JSON na origem.

### 3. Observabilidade Industrial (Telemetria)
- **Winston Logs Estruturados**: Unificação total da rastreabilidade.
- **ExecutionID**: ID único que conecta a *intenção* ao *ato*.
- **CorrelationID**: ID único que conecta o *ato* ao *efeito*.

---

## 🏁 Veredito
O BOLT é a inteligência que não apenas executa, mas **planeja, delibera e valida** antes de agir.

**"O BOLT é a velocidade do pensamento com a precisão do contrato."** ⚡📐💎🚀
