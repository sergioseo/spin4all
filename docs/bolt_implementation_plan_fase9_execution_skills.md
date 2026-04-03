# BOLT Fase 9: Execution Skills (Especialistas de Elite)

Este plano detalha a formalização do **Passo 6** da Esteira BOLT: a criação das **Execution Skills**. Até agora, o BOLT agia como um executor genérico. A partir desta fase, ele passará a utilizar instruções de sistema (`system.txt`) segregadas por especialidade, garantindo a máxima fidelidade aos padrões de elite do projeto **Spin4all**.

---

## 🎯 Objetivos Estratégicos
1.  **Skill-Segregation**: Implementar o Princípio 2 do Protocolo BOLT, separando as preocupações de Frontend, Backend e Banco de Dados.
2.  **Fidelidade ao Design**: Integrar o `UI_Style_Guide_Elite.md` diretamente na instrução da Skill de Frontend.
3.  **Padronização Industrial**: Definir contratos de entrada e saída (`input.json` / `output.json`) consistentes para cada especialista.
4.  **Isolamento de Escrita**: Reforçar as regras de I/O dentro da sandbox `/draft`.

---

## 🧱 Proposta de Arquitetura

Cada Skill viverá em `backend/src/governance/skills/[name]/` com a seguinte estrutura:
- `system.txt`: A "alma" do especialista. Instruções de sistema ultra-específicas.
- `input_schema.json`: Definição rigorosa do que a skill aceita.
- `output_schema.json`: Definição rigorosa do que a skill deve entregar.

### 1. 🎨 Frontend Skill (The Visual Guardian)
- **Foco**: HTML5 Semântico, Vanilla CSS (sem frameworks), Glassmorphism, Micro-interações.
- **Tokens**: Uso obrigatório de variáveis CSS do `:root`.
- **Glossário**: Radial Glow, Neon Glow, Card Assimétrico.

### 2. ⚙️ Backend Skill (The Logic Architect)
- **Foco**: Node.js, Serviços Atômicos, Controladores Limpos e Segurança.
- **Padrões**: Tratamento de erro centralizado, Respostas JSON, Validação de Esquema.
- **Privilégios**: Leitura e escrita controlada via `agent-controller.js`.

### 3. 🗄️ DB Skill (The Data Guardian)
- **Foco**: PostgreSQL, Migrações SQL Puras, Índices e Performance.
- **Regras**: Nada de queries destrutivas sem backup, foco em schemas relacionais limpos.

---

## 🛠️ Plano de Ação

### Etapa 1: Configuração de Infraestrutura de Skills
#### [NEW] [frontend/system.txt](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/skills/frontend/system.txt)
#### [NEW] [backend/system.txt](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/skills/backend/system.txt)
#### [NEW] [db/system.txt](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/src/governance/skills/db/system.txt)

### Etapa 2: Definição de Contratos (JSON Schemas)
Criar os esquemas base que o `OrchestratorExecutor` usará para validar se o agente está entregando o que prometeu no Manifesto.

---

## 🧪 Plano de Verificação

### Teste de Especialidade
1.  **Simulação Frontend**: Pedir para a Skill Frontend criar um botão e verificar se ela incluiu os gradientes e hovers do `UI_Style_Guide_Elite`.
2.  **Simulação Backend**: Pedir para a Skill Backend criar um serviço e verificar se ela segue a estrutura de `try/catch` centralizada.

---

## 📂 Arquivos Afetados
- `backend/src/governance/skills/frontend/system.txt` [NEW]
- `backend/src/governance/skills/backend/system.txt` [NEW]
- `backend/src/governance/skills/db/system.txt` [NEW]

---

> [!IMPORTANT]
> **User Review Required**:
> As instruções de sistema (`system.txt`) serão escritas em **Português** para manter a precisão terminológica do projeto, mas códigos e nomes de variáveis seguirão o padrão **Inglês**. Você concorda com essa abordagem bilíngue (Instrução em PT, Código em EN)?
