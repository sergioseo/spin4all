# Plano de Expansão: Banco de Metas do Analista

Este plano visa dobrar a variedade de missões disponíveis para o Analista, garantindo que o "receituário" técnico seja rico e não repetitivo, além de esclarecer o destino das missões concluídas.

## Mudanças Propostas

### Backend (server.js)
#### [MODIFY] [server.js](file:///c:/Users/sjwse/OneDrive/Documentos/Antigravity/spin4all/backend/server.js)
*   Expandir a constante `MISSION_TEMPLATES` (Linhas 86-107) com +15 novos itens distribuídos entre os 3 níveis de dificuldade.
*   Adicionar categorias novas: **Mental**, **Tática** e **Performance**.

## Lista de Novas Missões (Prévia)
### Nível 1
- **Sombra de Saque**: Treinar o gesto técnico de saque sem bola (15 repet.).
- **Análise de Pro**: Assistir 1 set de um jogador profissional e anotar 3 jogadas.
- **Paredão de Controle**: Rebater a bola na parede 20 vezes sem cair.

### Nível 2
- **Topspin Forehand**: Atacar bola com muito efeito cortado (Topspin básico).
- **Backhand Punch**: Contra-ataque chapado de backhand (10 acertos).
- **Variação de Saque BH**: Praticar saque de backhand focando na variação de spin (lateral/cavado) e não apenas na força.
- **Plano Tático**: Antes de iniciar o treino, definir 2 objetivos técnicos claros e revisá-los após as partidas.

### Nível 3 (Elite)
- **Contra-Topspin FH**: Reagir ao ataque do oponente com outro ataque.
- **Chiquita Paralela**: Ataque de pulso direcionado na linha lateral.
- **Transição em Grupo**: Durante as trocas de mesa, manter o drill de 3 bolas (Saque, Ataque, Bloqueio).
- **Mapa de Calor**: Durante um set, marcar onde o oponente mais erra.

## Fluxo de Conclusão e Radar de Esforço
As missões concluídas seguem este caminho:
1.  Status em `tb_missoes_usuario` muda para `flg_concluida = TRUE`.
2.  XP é somado na `tb_membros_perfil`.
3.  **DESTINO FINAL**: Registro em `trusted.tb_historico_maestria`.

### Nova Estratégia de Radar (O que falta implementar):
Para atender o pedido do usuário, implementaremos o **Radar de Esforço Aplicado**:
- **Backend**: Criar `/api/user/effort-stats` que agrupa XP de `tb_historico_maestria` por tag técnica (Forehand, Backhand, etc).
- **Frontend**: Inserir uma 3ª camada no gráfico de radar (cor diferenciada, ex: Laranja/Ambar) representando onde o usuário mais investiu "suor" através das missões.

## Verificação
1.  **Check de Sintaxe**: Garantir que o array `MISSION_TEMPLATES` está bem formado.
2.  **Verificação de IDs**: Garantir que os novos IDs (ex: `f_loop`) são únicos.
3.  **Teste de API**: Consultar `/api/missions/current` para ver se as novas missões são sorteadas (se o nível do usuário permitir).
