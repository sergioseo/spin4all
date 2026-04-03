# TICO --- Infraestrutura Estruturada (v10.1)

Esta documentação detalha a arquitetura física e lógica que sustenta o **Protocolo TICO** no ecossistema Antigravity. O sistema evoluiu de um validador de escopo para uma **Plataforma Multi-Agente de Elite**.

---

## 📂 1. Estrutura Física (Diretórios)

A inteligência de governança está centralizada em `backend/src/governance/`.

```bash
/governance
  ├── /skills             # "Cérebros" dos Agentes (Instruções)
  │   ├── /frontend       # Skill de Execução de UI
  │   ├── /backend        # Skill de Execução de Lógica/DB
  │   ├── /arquiteto      # Skill de Design de Contratos
  │   └── /po             # Skill de Requisitos (Negócio)
  ├── /contracts          # Schemas JSON de Validação
  │   ├── audit-schema.json
  │   └── task-manifest-schema.json
  ├── /orchestrator       # Lógica Central de Fluxo
  ├── /logs               # Auditoria Industrial (governance.log)
  ├── /tests              # Bateria de Testes Unitários de IA
  ├── agent-controller.js # "Porteiro" (Validador de Escopo)
  ├── promote.js          # Pipeline de Sincronização Transacional
  └── main.js             # Ponto de Entrada da Orquestração
```

---

## 🧠 2. Arquitetura de Skills (v3.1)

Cada agente (Skill) opera sob uma tríade de arquivos para garantir **determinismo absoluto**:

1.  **system.txt (Comportamento)**:
    -   Define "Quem eu sou" e "Como devo agir".
    -   Instruções fixas e versionadas.
    -   Ex: Restrições de design, boas práticas de código, tom de voz.
2.  **input.json (Contrato)**:
    -   Define "O que fazer" em formato técnico (JSON Schema).
    -   Gerado automaticamente pelo **Architect**, nunca diretamente pelo usuário.
3.  **output.json (Resultado)**:
    -   O produto final (Código, Diff ou SQL) validado pelo **QA**.

---

## 📐 3. Pipeline de Governança (Ciclo de Vida)

Todo comando humano passa pela esteira de validação TICO antes de tocar no código de produção:

### A. Camada Estratégica
1.  **User Input**: Você fala livremente em linguagem natural.
2.  **PO Skill**: Decompõe a sua fala em micro-tarefas atômicas.
3.  **Architect Skill**: Pega as tarefas e gera os **Contratos Técnicos** (Input JSON) para os executores.

### B. Camada Deliberativa (NOVO v3.1)
*   **Sync Execution**: Agentes Frontend e Backend conversam entre si para alinhar tipos de dados e nomes de funções, evitando quebras de integração "silenciosas".

### C. Camada de Execução (Sandbox)
1.  As Skills executam as mudanças no ambiente `/draft`.
2.  **QA Skill**: Valida o resultado contra o contrato inicial.

### D. Camada de Promoção
*   **Promote**: Se tudo for aprovado, o TICO sincroniza o `/draft` com o `/prod` (Branch Main) de forma atômica e com backup automático.

---

## 🛡️ 4. Regras de Ouro (Governança Hard)

-   **Zero Inline**: Proibido prompts embutidos no código. Tudo deve ser artefato versionado na pasta `/skills`.
-   **Manifest Lock**: Nenhuma ferramenta de edição de arquivo funciona sem um `TASK_MANIFEST.json` válido e pré-aprovado.
-   **Traceability**: Toda troca de mensagens entre agentes é gravada no `governance.log` com `ExecutionID`.

---

## Conclusão

A infraestrutura estruturada do TICO transforma IA em **Engenharia de Precisão**. O Sérgio lidera com **Intenção**, e o TICO executa com **Arquitetura**.

**"O segredo da elite é a infraestrutura que transforma criatividade em solidez."** 🛰️📐💎🚀
