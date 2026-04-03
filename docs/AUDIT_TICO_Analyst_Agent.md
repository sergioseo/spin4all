# Auditoria Técnica: Configuração do Agente e Prompts

Este documento abre a "caixa preta" do Analista para mostrar exatamente o que a IA está lendo e quais as regras de segurança do sistema.

## 1. O Prompt do Sistema (System Prompt)
Este é o comando exato enviado para o `gpt-4o-mini` (Linhas 845-855 do [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js)):

```text
Você é o Diretor Técnico de um clube de Tênis de Mesa (Spin4All). Sua análise deve ser baseada em DADOS TÉCNICOS e nunca em achismos ou promessas milagrosas (como melhorar 100% ou progredir 1 ano em 2 semanas).

REGRAS DE OURO:
1. "explicacao": Não repita o título. Seja direto na leitura técnica dos números.
2. "acao": Deve conter exatamente 2 sugestões de treinos específicos (Ex: Treino de multiball focado em [pontoX], drills de transição [Forehand/Backhand], rotinas de saque e terceira bola, ou trabalho de perna/Falkenberg). Use termos técnicos reais do esporte.
3. Não use linguagem de marketing. Use linguagem de treinador.
```

## 2. A "Bateria" de Dados Estáticos (15+ Templates)
Para garantir que as missões sejam reais, o motor usa o `MISSION_TEMPLATES` (Linhas 86-107):

*   **Nível 1 (Básico)**: Precisão Forehand, Backhand Seguro, Saque Curto, Sombra Lateral, Rally de Controle.
*   **Nível 2 (Intermediário)**: Topspin Forehand, Bloqueio Ativo, Saque Variado, Passo Cruzado, Transição BH/FH.
*   **Nível 3 (Avançado)**: Contra-Topspin, Chiquita Reflexo, Terceira Bola, Falkenberg, Finalização.

## 3. Arquitetura e Orquestração
*   **Quantos Agentes?**: **Apenas 1 agente ativo** (`gpt-4o-mini`) para a narrativa. 
*   **Onde está a Config?**: Toda a lógica está "hardcoded" no arquivo [backend/server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js). Não usamos arquivos de configuração externos para o comportamento do agente para evitar latência.

## 4. Plano de Contingência (E se o Agente falhar?)
O sistema possui 2 níveis de proteção:
1.  **Fallback por Flags (Sem API)**: Se a `OPENAI_API_KEY` falhar ou for `mock`, o motor usa uma **Narrativa Sintética** pré-escrita (Linhas 858-872) que foca especificamente em `STAMINA` ou `AGRESSIVO`. Você nunca ficará sem análise.
2.  **Fallback de Erro Fatal**: Se houver um erro de rede, o retorno é: *"Não foi possível gerar a narrativa. Tente novamente."*

## 5. Quem é o "Fiscal"? (Supervisão)
Não existe um segundo agente fiscalizando (isso dobraria o custo e o tempo). **A fiscalização é feita pelo Código (Engine Determinística)**:
*   A IA **não pode** criar missões novas. Ela apenas explica os dados.
*   As missões injetadas no seu mural são escolhidas pela **Lógica do Server** (Phase 4), que restringe as opções aos templates técnicos acima. 
*   **A "fiscal" é a matemática**: Se o WinRate caiu em jogos longos, a IA é "forçada" pelo prompt a falar de resistência, e o código injeta o Falkenberg Drill.

> [!IMPORTANT]
> A fiscalização é **Estrutural**. O sistema não dá liberdade para a IA alucinar treinos que não existem na nossa base técnica de Tênis de Mesa.
