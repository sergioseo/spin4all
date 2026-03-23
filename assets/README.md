# 📂 Diretório de Ativos (Assets)

> **Objetivo**: Centralizar recursos estáticos do projeto como imagens, ícones e mídias.

## 🔗 Mapeamento Técnico
-   **images/logo.png**: Identidade visual do Spin4all.
-   **images/mentor_sergio.png**: Avatar do mentor Sérgio para a interface de IA.
-   **images/mentor_americo.png**: Avatar do mentor Américo.
-   **images/mentor_fernando.png**: Avatar do mentor Fernando.
-   **images/about_community.png**: Imagem ilustrativa da comunidade.

## 🧬 Linhagem e Fluxo
-   **Entrada**: Arquivos estáticos criados no design (Figma/Photoshop).
-   **Uso**: Consumidos pelo Frontend via caminhos relativos em tags `<img>` e CSS `url()`.
-   **Saída**: Renderização visual na UI do usuário.

## ⚙️ Dependências e Impacto
-   **Depende de**: Nenhum serviço dinâmico.
-   **Impacto**: Estética e Branding. A deleção destes arquivos causa "quebra de imagem" (404) em áreas críticas como Profile e About.
