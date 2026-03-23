import { userService } from '../../services/user.service.js';
import { store, updateStore } from '../../state/store.js';
import { profileView } from './profile.view.js';

export default async function init() {
    console.log('[Profile] Iniciando Controller...');
    let user = store.user;
    
    // 1. Garantir que temos os dados do usuário
    if (!user || !user.num_skill_forehand) {
        console.warn('[Profile] Usuário no store incompleto, buscando na API...');
        try {
            const response = await userService.getUser();
            if (response.success) {
                user = response.user;
                updateStore('user', user);
            }
        } catch (e) {
            console.error('[Profile] Falha crítica ao recuperar usuário.');
            return;
        }
    }

    if (!user) {
        console.error('[Profile] Usuário não pôde ser carregado.');
        return;
    }

    // 2. Buscar Histórico de Evolução
    let evolution = [];
    try {
        const evResponse = await userService.getEvolution();
        if (evResponse.success) {
            evolution = evResponse.history || [];
        }
    } catch (e) {
        console.warn('[Profile] Não foi possível carregar histórico de evolução.');
    }

    // 3. Buscar Estatísticas de Esforço (Radar Ambar)
    let effortStats = [];
    let effortMap = {
        forehand: 0, backhand: 0, cozinhada: 0, topspin: 0,
        saque: 0, rally: 0, ataque: 0, defesa: 0,
        bloqueio: 0, controle: 0, movimentacao: 0
    };

    try {
        const effortRes = await userService.getEffortStats();
        if (effortRes.success) {
            effortStats = effortRes.stats || [];
            effortStats.forEach(s => {
                const tag = s.tag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (effortMap[tag] !== undefined) {
                    effortMap[tag] = Math.min(100, (s.total_xp / 10)); 
                }
            });
        }
    } catch (e) {
        console.warn('[Profile] Falha ao carregar radar de esforço.');
    }

    // 4. Renderiza a interface
    profileView.renderProfile(user, evolution, effortStats);

    // 4. Lógica do Botão Salvar (Dinâmico)
    const saveBtn = document.getElementById('btn-save-skills');
    if (saveBtn) {
        saveBtn.disabled = true; // Inicia inativo
        saveBtn.style.filter = 'grayscale(1)';
        saveBtn.style.opacity = '0.5';
        saveBtn.style.cursor = 'not-allowed';
    }

    // Guardar valores iniciais para comparação
    const initialValues = {};
    document.querySelectorAll('input[id^="skill-"]').forEach(s => {
        initialValues[s.id] = parseInt(s.value);
    });

    const checkChanges = () => {
        let hasChanges = false;
        document.querySelectorAll('input[id^="skill-"]').forEach(s => {
            if (parseInt(s.value) !== initialValues[s.id]) hasChanges = true;
        });

        if (saveBtn) {
            saveBtn.disabled = !hasChanges;
            if (hasChanges) {
                saveBtn.style.filter = 'none';
                saveBtn.style.opacity = '1';
                saveBtn.style.cursor = 'pointer';
            } else {
                saveBtn.style.filter = 'grayscale(1)';
                saveBtn.style.opacity = '0.5';
                saveBtn.style.cursor = 'not-allowed';
            }
        }
    };

    // 4. Listeners para os Sliders (Feedback em tempo real no gráfico e labels)
    const inputs = document.querySelectorAll('input[type="range"]');
    inputs.forEach(slider => {
        if (slider.id.startsWith('skill-')) {
            slider.addEventListener('input', (e) => {
                const key = e.target.id.replace('skill-', '');
                const val = parseInt(e.target.value);
                
                // Update Numeric Label
                const label = document.getElementById(`label-${key}`);
                if (label) label.textContent = val;
                
                // Update Textual Level Label
                profileView.updateSkillLabel(key, val);
                
                // Verificar se habilitamos o botão
                checkChanges();

                // Monta dados para atualização temporária do Gráfico (Dataset Atual)
                const tempSkills = {};
                document.querySelectorAll('input[id^="skill-"]').forEach(s => {
                    tempSkills[s.id.replace('skill-', '')] = parseInt(s.value);
                });
                
                // Re-renderiza o gráfico mantendo o histórico se existir
                profileView.renderRadarChart(tempSkills, evolution.length > 0 ? {
                    forehand: evolution[0].num_skill_forehand,
                    backhand: evolution[0].num_skill_backhand,
                    cozinhada: evolution[0].num_skill_cozinhada || 50,
                    topspin: evolution[0].num_skill_topspin || 50,
                    saque: evolution[0].num_skill_saque,
                    rally: evolution[0].num_skill_consistency || 50,
                    ataque: evolution[0].num_skill_ataque,
                    defesa: evolution[0].num_skill_defesa,
                    bloqueio: evolution[0].num_skill_bloqueio || 50,
                    controle: evolution[0].num_skill_controle,
                    movimentacao: evolution[0].num_skill_movimentacao
                } : null, effortMap);
            });
        }
    });

    // 5. Salvar Habilidades Técnicas
    if (saveBtn) {
        saveBtn.onclick = async () => {
            let response = null; 
            try {
                saveBtn.disabled = true;
                const originalText = '<i class="fas fa-save" style="margin-right: 8px;"></i> SALVAR STATUS';
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SALVANDO...';

                const skillsPayload = {};
                const localStoreUpdate = {};

                document.querySelectorAll('input[id^="skill-"]').forEach(s => {
                    const skillName = s.id.replace('skill-', '');
                    const val = parseInt(s.value);
                    skillsPayload[skillName] = val;
                    localStoreUpdate[`num_skill_${skillName}`] = val;
                });

                response = await userService.saveSkills(skillsPayload);
                
                if (response.success) {
                    updateStore('user', { ...store.user, ...localStoreUpdate });
                    
                    // Atualizar valores iniciais para o botão desabilitar novamente
                    Object.keys(localStoreUpdate).forEach(key => {
                        const sliderId = key.replace('num_skill_', 'skill-');
                        if (initialValues[sliderId] !== undefined) {
                            initialValues[sliderId] = localStoreUpdate[key];
                        }
                    });
                    
                    checkChanges();
                    
                    // Forçar re-renderização do gráfico para manter as duas camadas (Histórico x Novo Atual)
                    profileView.renderRadarChart(skillsPayload, evolution.length > 0 ? {
                        forehand: evolution[0].num_skill_forehand,
                        backhand: evolution[0].num_skill_backhand,
                        cozinhada: evolution[0].num_skill_cozinhada || 50,
                        topspin: evolution[0].num_skill_topspin || 50,
                        saque: evolution[0].num_skill_saque,
                        rally: evolution[0].num_skill_consistency || 50,
                        ataque: evolution[0].num_skill_ataque,
                        defesa: evolution[0].num_skill_defesa,
                        bloqueio: evolution[0].num_skill_bloqueio || 50,
                        controle: evolution[0].num_skill_controle,
                        movimentacao: evolution[0].num_skill_movimentacao
                    } : null, effortMap);

                    if (window.Swal) {
                        Swal.fire({
                            title: 'Sucesso!',
                            text: 'Habilidades salvas com sucesso!',
                            icon: 'success',
                            background: '#060e1a',
                            color: '#fff',
                            confirmButtonColor: '#38bdf8'
                        });
                    } else {
                        alert('Habilidades salvas com sucesso!');
                    }
                } else {
                    throw new Error(response.message || 'Erro do servidor');
                }

            } catch (err) {
                console.error(err);
                alert('Erro ao salvar: ' + err.message);
                checkChanges(); 
            } finally {
                // RESET TOTAL DO TEXTO (Fora de condicionais para garantir)
                saveBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i> SALVAR STATUS';
                
                // Se falhou, reabilita. Se teve sucesso, o checkChanges() já cuidou do estado disabled.
                if (!response || !response.success) {
                    saveBtn.disabled = false;
                }
            }
        };
    }
}
