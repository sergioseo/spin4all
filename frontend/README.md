# 📂 Camada de Interface (Frontend)

> **Objetivo**: Prover uma experiência de usuário premium, responsiva e performática, baseada em Glassmorphism e interatividade dinâmica.

## 🔗 Mapeamento Técnico
-   **index.html**: Landing page e porta de entrada pública.
-   **dashboard.html**: Painel principal do membro (Metrics/IA).
-   **monitoring.html**: Centro de Comando e Orquestração (Admin-only).
-   **torneios.html**: Interface de gestão e visualização de partidas.
-   **login/cadastro.html**: Fluxos de onboarding.
-   **pages/**: Estrutura modular de sub-páginas.
-   **js/modules/**: Lógica de negócio específica por domínio de UI.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Interações do usuário (Cliques, Inputs).
-   **Processamento**: Event Listeners → Modules → Services (Fetch API).
-   **Saída**: Atualização do DOM (UI) e feedbacks visuais.

## ⚙️ Dependências e Impacto
-   **Depende de**: Backend APIs via `frontend/js/config.js`.
-   **Impacto**: Primeira camada de contato do cliente. Falhas aqui impactam diretamente a percepção de qualidade e utilidade do Spin4all.
