# 🔐 Área Administrativa (Admin-Only)

> **Objetivo**: Prover interfaces de gestão, governança e monitoramento restritas aos administradores da comunidade Spin4all.

## 🔗 Mapeamento Técnico
-   **monitoring.html**: Dashboard de orquestração AI e Medallion.

## 🛡️ Segurança e Acesso
-   **Acesso Restrito**: Todas as páginas nesta pasta exigem que o usuário logado possua `flg_admin = TRUE`.
-   **Redirecionamento**: Caso um usuário comum tente acessar diretamente o HTML via URL, o módulo JS detectará o erro `403` na primeira chamada de API e redirecionará automaticamente para o `dashboard.html`.
-   **Proteção de API**: As rotas no Backend que alimentam estas telas estão protegidas pelo middleware `isAdmin`.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Token JWT de administrador.
-   **Processamento**: Validação de Role no Backend + Verificação de Status no Frontend.
-   **Saída**: Visualização de dados sensíveis de governança.
