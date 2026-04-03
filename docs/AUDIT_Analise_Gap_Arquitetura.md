# 📊 Avaliação de Arquitetura: Spin4All (Status: Rumo ao Nível 9.5)

Esta análise confronta o estado atual do repositório com os requisitos da **Arquitetura de Dados e AI Pipeline** proposta.

## 🟢 O que JÁ TEMOS (Implementado)

### 1. Medallion Data Layer
- **Schemas**: `raw`, `staging`, `trusted`, `refined` e `governance` já criados no Postgres.
- **RAW-First**: Implementado via `DataIngestor.js`. Nenhum dado entra sem passar pelo RAW.
- **ETL Idempotente**: `ETLEngine.js` realiza processamento incremental e seguro.

### 2. Governança e Observabilidade
- **ProcessMonitor.js**: Sistema de telemetria em tempo real.
- **Dashboard de Monitoramento**: Tela administrativa funcional para acompanhar jobs.

### 3. Separação em Camadas (Backend)
- Estrutura modular em `application`, `services/data`, `services/analysis` e `routes`.

---

## 🔴 O que FALTA (Gap Analysis)

Para atingir o objetivo de **Redução de Custo e Aumento de Confiabilidade**, precisamos focar nos seguintes pontos:

### 1. Centralização de Prompts (Prompt Registry)
- **Status**: Atualmente os prompts estão dispersos ou inline (no código de `AnalyzeTournamentMatches`).
- **Necessidade**: Mover para JSONs versionados em `/backend/src/prompts`. Isso reduz erro humano e facilita o tuning das IAs.

### 2. Engine de Estados de IA (Orquestrador)
- **Status**: O pipeline de análise atual é linear e em uma única passada. Se um passo falha, a análise "morre".
- **Necessidade**: Implementar um orquestrador que mova a análise pelos estados do ciclo de vida: `INPUT -> PARSE -> CLASSIFY -> GENERATE -> VALIDATE -> APPROVE`.

### 3. Modularização de Agentes (Domain Agents)
- **Status**: A lógica de chamada aos LLMs está embutida diretamente nos Use Cases.
- **Necessidade**: Criar classes de Agentes (ex: `IntentAgent`, `ValidatorAgent`) que seguem o contrato `{input, output, confidence}`.

---

## 🛠️ Lista de Implementação (Ponto a Ponto)

Aqui está o roadmap técnico detalhado para fechar o GAP:

### **1. Prompt Registry (O Hub de Inteligência)**
- **O que é**: Um diretório centralizado de arquivos JSON que contêm as instruções enviadas para as IAs.
- **Detalhe de Implementação**: Criar `backend/src/prompts/analysis/tournament_intent.json` e outros. Criar um `PromptManager.js` que carrega esses arquivos e substitui as variáveis dinamicamente.
- **Impacto**: Manutenibilidade e versionamento de "conhecimento" da IA.

### **2. AI Pipeline FSM (Finite State Machine)**
- **O que é**: Uma máquina de estados que persiste em que ponto da análise cada "Match" ou "Torneio" está.
- **Detalhe de Implementação**: Criar a tabela `governance.ai_analysis_states` para registrar em que fase (`PARSED`, `CLASSIFIED`, etc.) está o processo. Implementar o `OrchestratorService` para coordenar o disparo de cada Agente conforme o estado anterior.
- **Impacto**: Resiliência. Se a conexão cair no meio do "GENERATE", o sistema retoma do "VALIDATE" sem custo extra de tokens.

### **3. Domain Agents (Trabalhadores Especializados)**
- **O que é**: Pequenos módulos JS que cuidam de UMA ÚNICA coisa (ex: apenas parsear intenção).
- **Detalhe de Implementação**: Criar pastas `backend/src/services/analysis/agents/`. Cada Agente estende uma classe `BaseAgent` com os campos `execute()`, `validateSchema()` e `getConfidence()`.
- **Impacto**: Agnosticismo de modelo (podemos trocar o Agente de Classificação de GPT-4 para Claude 3 individualmente).

### **4. Camada de Refined Data (Visão de Negócio)**
- **O que é**: A camada final do Medallion que consolida dados complexos.
- **Detalhe de Implementação**: Criar queries agregadas que alimentam dashboards de performance técnica (ex: "Tendência de Backhand vs Forehand" em views no schema `refined`).
- **Impacto**: Performance de leitura no Frontend. Os gráficos carregarão instantaneamente.

### **5. Validator Agent (O Guarda-Costas)**
- **O que é**: Um agente de IA focado apenas em encontrar erros na saída dos outros.
- **Detalhe de Implementação**: Antes de gravar no banco `refined`, o `ValidatorAgent` confere se o JSON de saída respeita o contrato. Se `confidence < 0.8`, o processo é enviado para "Humano na Malha" ou re-tentativa.
- **Impacto**: Confiabilidade de 100% nos dados apresentados ao usuário final.

---
**Diagnóstico Final**: A fundação (Dados e Monitoramento) está sólida. Agora precisamos construir os "cérebros" (Agentes) e o "sistema nervoso" (Orquestrador) para chegar na elite 9.5+.
