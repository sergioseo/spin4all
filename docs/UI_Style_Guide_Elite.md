# 🎨 Guia de Estilo Spin4all Community (Premium Design)

Este documento define o padrão visual e a metodologia de interface (UI/UX) para o projeto **Spin4all**. O objetivo é garantir uma experiência "uau" (premium, moderna e funcional) em cada nova funcionalidade.

---

## 🏛️ 1. Fundação Visual (Design Tokens)

Todas as novas interfaces devem utilizar as variáveis CSS definidas no `:root` do projeto para garantir consistência.

### Cores Principais (Paleta Vibrant Dark)
*   **Background Base**: `#0f172a` (Profundidade e foco)
*   **Acento Principal**: `#38bdf8` (Azul Vibrante para botões e links)
*   **Acento Digital**: `#00e5ff` (Cian para evolução e tecnologia)
*   **Destaque Sucesso**: `#bef264` (Lime para qualificações e check-ins)
*   **Destaque Alerta**: `#f59e0b` (Âmbar para sequências e avisos)

### Glassmorphism (Efeito Vidro)
Para manter o aspecto sofisticado, usamos cards semi-transparentes:
*   **Fundo Glass**: `rgba(255, 255, 255, 0.03)`
*   **Borda Glass**: `1px solid rgba(255, 255, 255, 0.06)`
*   **Sombra de Card**: `0 10px 30px -10px rgba(0, 0, 0, 0.5)`

---

## 📐 2. Arquitetura de Layout

Seguimos uma estrutura limpa e hierárquica usando **CSS Grid** e **Flexbox**.

### Regras de Espaçamento
*   **Célula Base**: 8px (Paddings de 8, 16, 24, 32px).
*   **Gaps**: Sempre use `gap: 20px` ou `30px` entre grandes seções de conteúdo.

### Grid de Dashboard
*   **Layout Assimétrico**: Cards de destaque importantes (como Posição Geral) devem ocupar mais espaço (ex: `1.2fr` ou `2fr`) para criar ritmo visual.
*   **Responsividade**: O grid deve colapsar de 2 ou 3 colunas para 1 única coluna em telas menores que 900px.

---

## ✨ 3. Refinamento (O Fator Uau)

O diferencial do **Antigravity** é o polimento final.

### Micro-interações
*   **Hover Dinâmico**: Elementos interativos devem subir levemente (`translateY(-2px)`) e ganhar brilho (`filter: brightness(1.1)`).
*   **Neon Glow**: Números e badges de destaque devem ter um leve `text-shadow` ou `box-shadow` pulsante.
*   **Gradients**: Use gradientes lineares (90deg) em botões de ação:
    ```css
    background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%);
    ```

### Brilhos e Containers Circulares (Evitar Artefatos Quadrados)
Para evitar que o "box" técnico de um elemento apareça em efeitos de luz:
*   **Radial Glow**: Todo brilho circular deve usar `background: radial-gradient(circle, rgba(...) 0%, transparent 70%)`.
*   **Contenção**: Sempre aplique `border-radius: 50%` e `overflow: visible` em containers que possuem anéis de brilho (SVG) ou sombras complexas, garantindo que o brilho seja perfeitamente redondo.
*   **SVG Glow**: Em elementos SVG com filtros de glow, garanta que o container tenha `border-radius: 50%` para evitar que o filtro as vezes cause um fundo quadrado indesejado.

---

## 🔄 4. O Processo de Criação (Metodologia)

Sempre seguimos estes 5 passos ao criar ou refinar uma tela:

1.  **Fundação**: Definir os tokens de cores e variáveis CSS.
2.  **Estruturação**: Criar o HTML semântico com grids e flexbox.
3.  **Polimento**: Adicionar glassmorphism, sombras e gradientes.
4.  **Validação**: Testar visualmente no navegador e ajustar alinhamentos (paddings/margins).
5.  **Iteração**: Apresentar ao usuário e ajustar até atingir a nota 10/10.

---

## 🛠️ 5. Exemplos de Componentes

### Card de Destaque Premium
```html
<div class="card glass-card ripple-card" style="border-left: 4px solid var(--accent-blue);">
    <div class="card-title">TÍTULO DA SEÇÃO</div>
    <!-- Conteúdo Refinado aqui -->
</div>
```

### Badge de Status
```html
<span style="font-size: 8px; font-weight: 900; background: var(--accent-lime); color: #000; padding: 2px 8px; border-radius: 4px;">
    STATUS
</span>
```

---

*Documento mantido e seguido pelo Agente Antigravity para a comunidade Spin4all.*
