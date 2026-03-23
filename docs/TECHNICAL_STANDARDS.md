# 📕 Padrões de Documentação Técnica (Spin4all)

Este documento define como cada pasta do projeto deve ser mapeada para garantir rastreabilidade e facilidade de manutenção.

## 📝 O Arquivo `README.md` de Pasta
Cada diretório significativo deve conter um `README.md` seguindo estas seções:

### 1. Objetivo (The Why)
Explique resumidamente por que esta pasta existe e qual seu papel no ecossistema Spin4all.

### 2. Mapeamento de Ativos (The What)
-   **Arquivos**: Liste os arquivos principais e suas funções.
-   **APIs**: Endpoints expostos (se for um controller/route).
-   **Assets**: Imagens, Sons ou Configurações contidas aqui.

### 3. Linhagem e Fluxo (Lineage)
Descreva de onde vêm os inputs e para onde vão os outputs.
Exemplo: `Input (Request Body) -> Ingestor -> Schema RAW (Postgres)`.

### 4. Dependências e Impacto (Risk)
-   Quais serviços este diretório consome?
-   Se alterarmos algo aqui, quem mais precisa ser testado?

---

## 🎨 Tom de Voz
-   Direto ao ponto.
-   Focado em engenharia e arquitetura.
-   Mencionar "Linhagem" para facilitar o entendimento de pipelines.
