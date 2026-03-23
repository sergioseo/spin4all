# 📂 Camada de Roteamento (API Gateway)

> **Objetivo**: Definir os contratos de API e delegar o processamento para os controladores adequados.

## 🔗 Mapeamento Técnico
-   **auth.routes.js**: `/api/auth/*` (Login, Registro, Google Auth).
-   **user.routes.js**: `/api/user/*` (Perfil, Skills, Badges).
-   **attendance.routes.js**: `/api/attendance/*` (Check-ins, Frequência).
-   **analysis.routes.js**: `/api/analysis/*` (Torneios, Relatórios AI).
-   **admin.routes.js**: `/api/admin/*` (Gestão de Membros, Relatórios Admin).

## 🧬 Linhagem e Fluxo
-   **Entrada**: HTTP Requests via Frontend (fetch/axios).
-   **Processamento**: Middleware (Auth/Admin) → Route → Controller.
-   **Saída**: JSON (Success/Error) + Status Codes.

## ⚙️ Dependências e Impacto
-   **Depende de**: `middlewares/auth.middleware.js`, `controllers/`.
-   **Impacto**: Interface única de comunicação com o mundo externo. Qualquer alteração aqui impacta diretamente o Frontend e requer atualização de contratos.
