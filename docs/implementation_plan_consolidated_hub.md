# Plano de Restauração: Hub Consolidado (v2-Colunas)

Este plano visa retornar ao layout que o usuário identificou como o mais funcional: uma coluna de Frequência à esquerda e um Hub Consolidado (integrando o Analista, Mural de Missões e Conquistas) à direita.

## Proposed Changes

### [Home Layout]

#### [MODIFY] [home.html](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/pages/home.html)
- **Estrutura de Grade**: `.home-grid-split` (1fr 1.6fr).
- **Lado Esquerdo (Frequência)**:
    - **Card de Frequência**: Gauge circular de progresso, percentual grande, status ("Elite", "Consistente").
    - **Calendário de Presença**: Grid de 14 dias com check-ins destacados.
    - **CTA Secundária**: Botão "Marcar Treino".
- **Lado Direito (O GRANDE HUB)**:
    - **Header Unificado**: Título "DIÁRIO DE BORDO & EVOLUÇÃO".
    - **Área 1: Veredito do Coach (O Motor)**:
        - Headline impactante.
        - Texto de análise detalhado.
        - Mini-estatísticas (Win Rate, Oscilação).
        - Botão de Ação Sugerida.
    - **Área 2: Mural de Missões (Missões Ativas)**:
        - Lista de tarefas recomendadas pelo Analista.
    - **Área 3: Mural de Conquistas (Badges)**:
        - Grid horizontal de medalhas e conquistas alcançadas.

#### [MODIFY] [dashboard.css](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/dashboard.css)
- Restaurar o **Container Único Glassmorphism** para o Hub.
- Definir hierarquia de títulos e separadores sutis entre as 3 áreas do Hub.
- Garantir que a coluna da esquerda tenha a largura fixa/proporcional correta para o calendário.

#### [MODIFY] [home.view.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/js/modules/home/home.view.js)
- Sincronizar `updateAnalyst` para injetar dados no headline, resumo e nos grupos de missões dentro do mesmo card.
- Garantir que [updateFrequency](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/frontend/js/modules/home/home.view.js#15-40) reflita os dados no card da esquerda.

---

## Verification Plan

### Manual Verification
1. Abrir o portal e confirmar se a **Frequência** está isolada à esquerda.
2. Confirmar se o **Analista, Missões e Conquistas** estão unificados em um único bloco à direita.
3. Verificar se o **Calendário** está logo abaixo da Frequência na coluna esquerda.
