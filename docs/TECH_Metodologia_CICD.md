# 🚀 Metodologia de Construção e CD (Spin4all)

Este documento define o processo de **Entrega Contínua (CD)** do projeto. O foco é a qualidade visual e a segurança operacional.

---

## 🛑 REGRA DE OURO: Deploy Manual Inegociável

**NUNCA** realize um deploy automatizado ou automático para o ambiente de produção/GitHub. Esta regra é absoluta e não aceita exceções.

1.  **Validação do Usuário**: Todo e qualquer ajuste, por menor que seja, deve ser apresentado ao usuário em ambiente local ou via screenshot/browser-audit.
2.  **Solicitação de Deploy**: O deploy (Push para Main) só deve ocorrer após um comando explícito do usuário ("Pode subir", "Fazer deploy", etc).
3.  **Fluxo de Hotfix**: Mesmo ajustes urgentes devem passar pelo crivo visual antes do envio.

---

## 📦 Agrupamento de Entregas

Para otimizar o versionamento, as entregas devem ser agrupadas por:
*   **Temas**: Refatoração de UI de uma seção completa.
*   **Assuntos**: Atualização de lógica de analista ou banco de dados.
*   **Sessões**: Finalização de uma jornada de trabalho específica.

*Nota: Pequenos ajustes pontuais podem ser enviados individualmente, desde que validados.*

---

## 🛠️ O Ciclo de CD (Continuous Design)

Seguimos este pipeline rigoroso para garantir o "Fator Uau" (Nota 10/10):

1.  **Alinhamento & Dúvida Zero**: 
    *   Se houver qualquer ambiguidade no design ou funcionalidade, o Agente **deve pausar e perguntar**.
    *   Uso de recursos visuais inteligentes (mockups, descrições detalhadas de layout) para alinhar a expectativa com o usuário antes de codar.

2.  **Codificação de Precisão**: 
    *   Implementação baseada estritamente no `STYLE_GUIDE.md`.
    *   Foco absoluto em: **Glows circulares**, **Glassmorphism real**, **Espaçamento de 8px** e **Gradientes suaves**.

3.  **Auditoria Visual de Elite (O Crivo de Qualidade)**:
    Uso obrigatório do `browser_subagent` para comparação técnica detalhada:
    *   **Caixas & Bordas**: Validação de `border-radius` (curvas suaves) e `border-width` (quase imperceptíveis, estilo glass).
    *   **Brilhos & Glows**: Inspeção de `box-shadow` e `text-shadow`. O brilho deve ser radial e natural, sem "bordas" cortadas.
    *   **Efeitos & Fundos**: Verificação de `backdrop-filter: blur()` e camadas de gradiente.
    *   **Espaçamentos (Gaps/Paddings)**: Verificação de equilíbrio simétrico e hierarquia visual.
    *   *Nota: Se algum componente parecer "chapado" ou "genérico", ele deve ser descartado e refeito.*

4.  **Teste de Campo (Browser-First)**:
    *   Toda alteração de código exige um teste visual imediato no navegador. 
    *   O Agente não pode assumir que "vai funcionar"; ele deve **ver** funcionando antes de reportar progresso.

5.  **Apresentação & Validação Final**: 
    *   Demonstração clara do resultado final ao usuário.
    *   Aprovação do "sinal verde".

6.  **Execução do Deploy (Somente com Autorização)**: 
    *   **PROIBIDO**: Nunca realizar o deploy sem validação visual prévia e autorização explícita ("Pode subir", "Deploy liberado").
    *   Uso do comando `/github-update` ou execução do script `github-update.bat` apenas após o sinal verde.

---

*Este método garante que a comunidade Spin4all receba apenas interfaces de altíssimo nível, onde cada detalhe - por menor que seja - é tratado com obsessão por qualidade.*
