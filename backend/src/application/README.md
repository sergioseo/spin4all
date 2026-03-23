# 🏗️ Camada de Aplicação (Application)

> **Objetivo**: Orquestrar a lógica de negócio e os processos de domínio, servindo como ponte entre os Controladores e os Serviços de Infraestrutura.

## 🔗 Mapeamento Técnico
-   **use-cases/**: Casos de uso específicos que isolam a complexidade de orquestração.
-   **schemas/**: Definições de contratos e validações de dados.

## 🧬 Linhagem e Fluxo
-   **Entrada**: DTOs/Objetos validados vindos dos Controladores.
-   **Processamento**: Orquestração de múltiplos serviços (Data, Analysis, Auth).
-   **Saída**: Dados prontos para o Controlador responder à API.
