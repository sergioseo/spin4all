# 📂 Módulos de Lógica de UI (Frontend Modules)

> **Objetivo**: Separar a lógica de orquestração da interface por domínio funcional.

## 🔗 Mapeamento Técnico
-   **home/**: Gerencia a landing page e a CTA inicial.
-   **profile/**: Lógica de exibição e edição de dados do membro (Skills/Bio).
-   **settings/**: Configurações de conta e segurança.
-   **dashboard/**: (Pendente de refatoração modular) Lógica de Metrics e Cards de IA.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Ações do usuário capturadas via DOM.
-   **Processamento**: Tratamento local → Chamada ao `services/` correspondente.
-   **Saída**: Mudança de estado visual ou navegação de página.

## ⚙️ Dependências e Impacto
-   **Depende de**: `frontend/js/services/`, Redux ou State Manager (se houver).
-   **Impacto**: Isolamento de erros. Uma falha no módulo de perfil não deve impedir o funcionamento das configurações.
