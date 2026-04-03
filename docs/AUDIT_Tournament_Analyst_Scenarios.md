# Matriz de Cenários - Analista Pessoal de Torneios

Esta matriz define a lógica de decisão do motor de insights para garantir precisão técnica e relevância nas recomendações de evolução.

## 1. Cenários Baseados em Torneio (Dados Reais)

| ID | Cenário | Condição Lógica | Explicação (Simples) | Insight Principal | Foco Técnico (Missões) | Sugestão de Badge |
|:---|:---|:---|:---|:---|:---|:---|
| **T1** | **Dominante** | WR ≥ 70% E AvgDiff > 3 | Você ganha quase tudo e com muita folga no placar. | "Você está em outro nível. Hora de buscar adversários mais fortes." | Desafios de Elite / Tática Avançada | Mestre do Torneio |
| **T2** | **Cirurgião (Clutch)** | WR ≥ 70% E (Sets 3-2 OU Margem < 3 pts/set) | Você ganha quase tudo, mas resolve a maioria dos jogos no último set ou por apenas 2 pontos de diferença. | "Mestre da precisão. Você vence nos detalhes e sob pressão." | Manutenção de Foco / Saque Decisivo | Sangue Frio |
| **T3** | **Instável** | WR 40-60% E Var(Diff) Alta | Você ganha metade dos jogos, mas alterna entre vitórias fáceis e derrotas pesadas. | "Potencial alto, mas oscilante. Sua técnica aparece, mas falta constância." | Consistência de Rally / Controle de Erros | Guerreiro Constante |
| **T4** | **Paredão (Equilibrado)** | WR 40-60% E AvgDiff ≈ 0 | Você ganha metade dos jogos e todas as partidas são extremamente disputadas. | "Você é difícil de ser batido, mas falta o 'golpe de misericórdia'." | Finalização de Ponto / Agressividade | Muralha Intransponível |
| **T5** | **Quase Lá (Choke)** | WR < 40% E (Sets 2-3 OU Margem < 3 pts/set) | Você perde a maioria, mas quase sempre leva o jogo para o set de desempate ou perde por apenas 2 pontos. | "Jogos decididos no detalhe. Você compete bem, mas perde nos pontos finais." | Treino Mental / Simulação de Pressão | Fênix (Resiliência) |
| **T6** | **Em Evolução** | WR < 40% E AvgDiff ≤ -3 | Você ainda está encontrando dificuldades para pontuar contra adversários. | "Fase de construção de base. O foco agora é volume e fundamentos." | Fundamentos Básicos / Regularidade | Aprendiz Dedicado |

---

## 2. Cenários de Fallback (Baseados em Diagnóstico / Nivelamento)

| ID | Cenário | Condição Lógica | Explicação (Simples) | Insight Principal | Foco Técnico (Missões) | Sugestão de Badge |
|:---|:---|:---|:---|:---|:---|:---|
| **F1** | **Gap Técnico Específico** | Uma skill < 40% e média > 60% | Você é bom no geral, mas tem uma técnica específica que precisa de muito treino. | "Seu nível é sólido, mas o [Skill] está limitando seu crescimento." | Treino isolado da Skill falha | Especialista |
| **F2** | **Iniciante Equilibrado** | Todas as skills < 50% | Você está começando agora e todas as suas técnicas estão em nível básico. | "Bem-vindo à jornada! Vamos construir seus fundamentos de forma equilibrada." | Introdução ao Spin / Coordenação | Mestre do Form |
| **F3** | **Veterano Estático** | Todas as skills > 70% E Frequência < 50% | Você tem muita técnica, mas treina pouco para manter o ritmo de jogo. | "Sua técnica é excelente, mas falta ritmo de jogo para performar em torneios." | Aumento de Volume / Jogos de Treino | Presença Vip |

---

## 3. Como o Analista "enxerga" dentro do jogo? (Sem achismos)

Para evitar conclusões rasas, o motor de busca não olha apenas se você ganhou ou perdeu. Ele analisa a **"densidade"** da partida através do campo `jsn_pontos_detalhado`:

1.  **Margem de Set:** Se você venceu por 11-9 ou 12-10, o sistema entende como **"Ponto de Pressão"**. Ganhar muitos desses define o perfil **Cirurgião**.
2.  **Equilíbrio de Sets:** Um jogo que termina em 3-2 é processado com peso diferente de um 3-0. O 3-2 demonstra **Resiliência** (se venceu) ou **Gargalo de Finalização** (se perdeu).
3.  **Diferença Acumulada:** Se em 3 sets você fez 33 pontos e o adversário 30, a diferença média é de apenas 1 ponto por set. Isso é tecnicamente um **"Empate Técnico"** resolvido no detalhe.

---

## 4. Motor de Prioridades e Hierarquia (Qual insight vence?)

Para evitar contradições, o sistema segue esta ordem de processamento:

1.  **PRIORIDADE 1: Torneio Recente (T1-T6)** -> Se houver dados de torneio nos últimos 30 dias, este é o cenário "Âncora".
2.  **PRIORIDADE 2: Refinamento por Adversário** -> Ajusta o cenário 1 (ex: "Dominante contra adversários fracos" ou "Guerreiro contra Gigantes").
3.  **PRIORIDADE 3: Fator Tempo (Stamina/Estilo)** -> Adiciona flags de comportamento baseadas na duração das partidas.
4.  **FALLBACK: Diagnóstico (F1-F3)** -> Apenas se NÃO houver dados de torneio suficientes.

---

## 5. Score de Confiança (Credibilidade)

O sistema apresenta quão sólida é a análise para gerar transparência:

| Nível | Condição | UI / Cópia |
|:---|:---|:---|
| **ALTA** | Jogos ≥ 6 | "Análise baseada em volume sólido de jogos." |
| **MÉDIA** | Jogos 3-5 | "Tendência baseada nas suas últimas partidas." |
| **BAIXA** | Jogos < 3 | "Primeiras impressões (ainda em fase de coleta)." |

---

## 6. Camada de Evolução (Histórico Temporal)

O Analista compara o torneio atual com o histórico:

- **Melhora:** Delta WR > +10% ou Subida de Percentil. -> *"Você está em franca evolução técnica."*
- **Estagnação:** Delta WR ≈ 0 e Delta Diff ≈ 0. -> *"Seu padrão de jogo se repete. Hora de mudar a estratégia."*
- **Alerta de Queda:** Delta WR < -15%. -> *"Atenção: sua performance oscilou para baixo. Vamos retomar os fundamentos."*

---

## 7. Variável: Tempo de Jogo (Integrado)

O tempo de jogo deixa de ser apenas um "ad-on" e torna-se um modificador de perfil:

- **Flag [STAMINA]:** WR (Jogos Longos) < WR (Jogos Curtos) em mais de 20%. -> *"Atenção: Queda de rendimento em jogos de longa duração."*
- **Flag [AGRESSIVO]:** Média de pontos por minuto significativamente acima da média da liga. -> *"Estilo de jogo agressivo e de definição rápida."*

---

## 8. Tratamento de Anomalias de Dados (Tempo)

Para evitar que erros humanos (esquecer de parar o cronômetro) gerem insights falsos, o motor aplica filtros de integridade:

1.  **Filtro de Sanidade Dinâmico (Proporcional):**
    - Em vez de limites fixos, o sistema calcula a validade baseada no **Total de Sets**:
        - **Mínimo:** 1 minuto por set jogado (ex: 3-0 min 3 min).
        - **Máximo:** 20 minutos por set jogado (ex: 3-2 max 100 min).
    - Partidas fora dessa margem proporcional são marcadas como "Erro de Registro" e o tempo é ignorado para não poluir os perfis de Stamina/Agressividade.
2.  **Duração Estimada (Fallback de Confiança):**
    - Se o tempo for detectado como erro, o motor utiliza a média histórica do usuário (ou 7 min/set) apenas para não quebrar a lógica, mas o **Score de Confiança** daquele insight específico cai para **BAIXO**.
3.  **Proteção de Churn:**
    - O sistema prioriza sempre os dados de pontos/sets. O tempo é um "temperador" de insight: se ele for duvidoso, o sistema silencia a flag de tempo e foca na técnica.

---

## 9. Motor de Narrativa e Pesos (O "10/10")

Para garantir que a comunicação seja clara e não contraditória, aplicamos pesos de impacto antes de gerar o output final.

### 8.1 Orquestração de Pesos (Impact Score)
- **Cenário Principal (T1-T6):** Peso 50%
- **Camada de Evolução (Melhora/Queda):** Peso 30%
- **Flags de Comportamento (Stamina/Agressão):** Peso 20%

### 8.2 Template Narrativo Fixo
O output final deve sempre seguir esta ordem para evitar ruído:
1.  **Headline (O Que Está Acontecendo):** Ex: "Você compete bem, mas perde nos momentos decisivos."
2.  **Explicação (O Porquê):** Ex: "Sua taxa de vitória cai 40% em jogos que duram mais de 25 minutos."
3.  **Ajustes Críticos (Foco):** Ex: "Resistência Física" e "Decisão em Pontos Críticos".
4.  **Próximo Passo (Ação):** Ex: "Realize a missão [Resiliência em Rally] para mudar esse padrão."

### 8.3 Modo Iniciante Protegido (Churn Prevention)
- Se o usuário for **Novo** (Jogos < 5):
    - Substituir "Dificuldade Geral" por "Fase de Construção de Base".
    - Focar em "Fundamentos" e "Incentivo" em vez de análise crítica de performance.

---

## 9. Regras de Ouro e Anti-Contraditórias

1.  **Hierarquia:** T-Scenarios > F-Scenarios.
2.  **Refinamento:** Se houver conflito (ex: Cirurgião + Falta Stamina), o cenário T2 prevalece, e a Stamina vira uma "Observação de Alerta".
3.  **Normalização:** O WR é ajustado pela força dos oponentes enfrentados (`difficulty_factor`).
4.  **Memória de Padrão:** Se um comportamento se repetir em 3 torneios, é marcado como **"Padrão Dominante"**.
5.  **Transparência:** Sempre exibir o **Score de Confiança** (Alta/Média/Baixa) baseado no volume de jogos.
