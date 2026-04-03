# 🤖 Arquitetura AI Elite (LLM-Ops)

Elevamos o motor analítico do Spin4all para um sistema de agentes orquestrados por estados, garantindo custo mínimo e precisão máxima.

## 🏗️ 1. Pipeline de Estados
O processamento de IA segue o fluxo linear e auditável:
1.  **INPUT**: Dados sanitizados vindos da camada `REFINED`.
2.  **PARSE**: Agente de Intenção extrai o contexto do usuário.
3.  **GENERATE**: Agente Gerador cria a narrativa baseada no `REFINED`.
4.  **VALIDATE**: Agente Validador verifica integridade do JSON e regras de negócio.
5.  **APPROVE**: Persistência em Cache Semântico e entrega ao Frontend.

## 📂 2. Prompt Registry (`/backend/prompts/`)
Substituiremos prompts inline por arquivos JSON versionados.
*   `intent.json`: Determina o que o usuário quer saber.
*   `analysis_narrative.json`: Regras técnicas para a análise de torneio.
*   `validation_rules.json`: Critérios de aceite para a resposta da IA.

## 👥 3. Agent Contract
Cada componente de IA deve respeitar o contrato:
```json
{
  "agent": "GeneratorAgent",
  "version": "1.0.2",
  "input": { ... },
  "output": { ... },
  "confidence": 0.85
}
```

---
**Esta arquitetura elimina o "achismo" da IA e transforma o Spin4all em um sistema determinístico e auditável.**
