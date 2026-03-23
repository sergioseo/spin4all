const MISSION_TEMPLATES = [
    // --- TÉCNICO (Nível 1-3) ---
    { id: 'f_basic', title: 'Precisão FH', desc: 'Acerte 10 forehands seguidos.', cat: 'Técnico', xp: 10, tag: 'Forehand' },
    { id: 'b_basic', title: 'Backhand Seguro', desc: 'Mantenha 8 bolas sem errar de backhand.', cat: 'Técnico', xp: 10, tag: 'Backhand' },
    { id: 'f_inter', title: 'Topspin Forehand', desc: 'Ataque 10 bolas cortadas com giro.', cat: 'Técnico', xp: 25, tag: 'Topspin' },
    { id: 'b_punch', title: 'Backhand Punch', desc: 'Contra-ataque chapado de backhand (10 repetições).', cat: 'Técnico', xp: 25, tag: 'Backhand' },
    { id: 'f_counter', title: 'Contra-Topspin FH', desc: 'Reagir ao ataque do oponente com outro ataque.', cat: 'Técnico', xp: 40, tag: 'Ataque' },
    { id: 'b_chiquita', title: 'Chiquita Paralela', desc: 'Ataque de pulso direcionado na linha lateral.', cat: 'Técnico', xp: 40, tag: 'Técnico' },
    { id: 'b_active_block', title: 'Bloqueio Ativo', desc: 'Bloqueie 15 ataques direcionando para os cantos.', cat: 'Técnico', xp: 30, tag: 'Bloqueio' },
    { id: 'f_slice', title: 'Cozinhada FH', desc: 'Mantenha 10 bolas curtas com efeito de corte.', cat: 'Técnico', xp: 15, tag: 'Cozinhada' },
    { id: 'b_slice', title: 'Cozinhada BH', desc: 'Corte de backhand baixo e rente à rede.', cat: 'Técnico', xp: 15, tag: 'Cozinhada' },
    { id: 'f_smash', title: 'Smash de Elite', desc: 'Finalize 5 bolas altas com máxima potência.', cat: 'Técnico', xp: 30, tag: 'Ataque' },

    // --- FÍSICO (Nível 1-3) ---
    { id: 'm_basic', title: 'Sombra Lateral', desc: '2 séries de 1 min de sombra técnica.', cat: 'Físico', xp: 15, tag: 'Movimentação' },
    { id: 'm_inter', title: 'Passo Cruzado', desc: 'Treine o passo cruzado (cross-step) por 5 min.', cat: 'Físico', xp: 30, tag: 'Movimentação' },
    { id: 'm_elite', title: 'Falkenberg', desc: 'Execute o padrão Falkenberg por 5 min.', cat: 'Físico', xp: 50, tag: 'Movimentação' },
    { id: 'm_agility', title: 'Agilidade', desc: 'Escada de coordenação focado em pernas (3 séries).', cat: 'Físico', xp: 25, tag: 'Movimentação' },
    { id: 'm_explosion', title: 'Explosão de Mesa', desc: 'Ataques rápidos alternando cantos (1 min).', cat: 'Físico', xp: 40, tag: 'Fisico' },
    { id: 'm_stamina', title: 'Resistência de Pernas', desc: '30 seg de deslocamento máximo + 30 seg descanso (5x).', cat: 'Físico', xp: 35, tag: 'Fisico' },
    { id: 'm_jump_squat', title: 'Salto Explosivo', desc: '15 saltos verticais seguidos de sombra rápida.', cat: 'Físico', xp: 20, tag: 'Fisico' },
    { id: 'm_core', title: 'Estabilidade Core', desc: 'Prancha por 1min para melhorar a postura na mesa.', cat: 'Físico', xp: 15, tag: 'Fisico' },
    { id: 'm_recovery', title: 'Mobilidade Flex', desc: 'Alongamento dinâmico focado em tronco e punho.', cat: 'Físico', xp: 10, tag: 'Fisico' },

    // --- TÁTICO (Nível 1-3) ---
    { id: 's_basic', title: 'Saque Curto', desc: 'Faça 15 saques que pinguem duas vezes na mesa.', cat: 'Tático', xp: 15, tag: 'Saque' },
    { id: 's_inter', title: 'Saque Variado', desc: 'Varie o efeito lateral e baixo (20x).', cat: 'Tático', xp: 30, tag: 'Saque' },
    { id: 's_elite', title: '3ª Bola', desc: 'Saque curto e prepare o ataque decisivo (10x).', cat: 'Tático', xp: 50, tag: 'Saque' },
    { id: 't_tactics', title: 'Plano Tático', desc: 'Definir 2 objetivos antes do treino e revisá-los.', cat: 'Tático', xp: 20, tag: 'Controle' },
    { id: 's_spin_bh', title: 'Variação de Spin BH', desc: 'Mudar o spin no saque de backhand (lateral/cavado).', cat: 'Tático', xp: 35, tag: 'Saque' },
    { id: 't_group', title: 'Transição em Grupo', desc: 'Drill de 3 bolas (Saque, Ataque, Bloqueio) em duplas.', cat: 'Tático', xp: 25, tag: 'Tático' },
    { id: 't_opp_analysis', title: 'Mapa de Calor', desc: 'Durante um set, identifique onde o oponente erra.', cat: 'Tático', xp: 40, tag: 'Tático' },
    { id: 't_rhythm', title: 'Mudança de Ritmo', desc: 'Varie entre bolas lentas e rápidas no mesmo rally.', cat: 'Tático', xp: 30, tag: 'Tático' },
    { id: 't_service_deep', title: 'Saque Longo Rápido', desc: 'Surpreenda com 10 saques rápidos na linha de fundo.', cat: 'Tático', xp: 20, tag: 'Saque' },
    { id: 't_short_game', title: 'Jogo Curto (Net)', desc: 'Mantenha 15 bolas curtas sem permitir ataque.', cat: 'Tático', xp: 35, tag: 'Controle' },
    { id: 't_mental_focus', title: 'Foco Sob Pressão', desc: 'Simule sets começando em 9-9 e jogue 5 vezes.', cat: 'Tático', xp: 45, tag: 'Tático' }
];

const BADGE_TEMPLATES = [
    { id: 'diag_master', title: 'Mestre do Form', desc: 'Concluiu o Diagnóstico', icon: 'fa-file-signature' },
    { id: 'first_step', title: 'Primeiro Passo', desc: '1ª missão concluída', icon: 'fa-shoe-prints' },
    { id: 'weekly_warrior', title: 'Guerreiro', desc: '3 missões na semana', icon: 'fa-calendar-check' },
    { id: 'forehand_pro', title: 'Fera Forehand', desc: 'Domínio de Forehand', icon: 'fa-fist-raised' },
    { id: 'blocking_wall', title: 'Muralha', desc: 'Mestre do Bloqueio', icon: 'fa-shield-halved' },
    { id: 'slice_master', title: 'Estrategista', desc: 'Mestre da Cozinhada', icon: 'fa-chess-knight' },
    { id: 'topspin_king', title: 'Topspin King', desc: 'Rei do Topspin', icon: 'fa-crown' },
    { id: 'constancy_hero', title: 'Constante', desc: 'Frequência > 80%', icon: 'fa-user-check' },
    { id: 'fire_starter', title: 'Pegando Fogo', desc: 'Streak de 3 dias', icon: 'fa-fire' },
    { id: 'mission_hunter', title: 'Caçador', desc: '5 missões no total', icon: 'fa-bullseye' },
    { id: 'rank_climber', title: 'Escalada', desc: 'Subiu no Ranking', icon: 'fa-chart-line' },
    { id: 'technical_elite', title: 'Elite Técnica', desc: 'Status Avançado', icon: 'fa-gem' },
    { id: 'consistency_god', title: 'Deu da Mesas', desc: '100% de Frequência', icon: 'fa-bolt' },
    { id: 'mission_collector', title: 'Colecionador', desc: '10 missões no total', icon: 'fa-layer-group' },
    { id: 'marathoner', title: 'Maratonista', desc: '30 dias na Spin4All', icon: 'fa-stopwatch' }
];

module.exports = {
  MISSION_TEMPLATES,
  BADGE_TEMPLATES,
};
