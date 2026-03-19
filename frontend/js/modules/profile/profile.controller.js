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

    // 2. Renderiza a interface
    profileView.renderProfile(user);

    // 3. Listeners para os Sliders (Feedback em tempo real no gráfico)
    const inputs = document.querySelectorAll('input[type="range"]');
    inputs.forEach(slider => {
        if (slider.id.startsWith('skill-')) {
            slider.addEventListener('input', (e) => {
                const key = e.target.id.replace('skill-', '');
                const label = document.getElementById(`label-${key}`);
                if (label) label.textContent = e.target.value;
                
                // Monta dados para atualização temporária do Gráfico
                const tempSkills = {};
                document.querySelectorAll('input[id^="skill-"]').forEach(s => {
                    tempSkills[s.id.replace('skill-', '')] = parseInt(s.value);
                });
                profileView.renderRadarChart(tempSkills);
            });
        }
    });

    // 4. Salvar Habilidades Técnicas
    const saveBtn = document.getElementById('btn-save-skills');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            try {
                saveBtn.disabled = true;
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SALVANDO...';

                const skillsPayload = {};
                const localStoreUpdate = {};

                document.querySelectorAll('input[id^="skill-"]').forEach(s => {
                    const skillName = s.id.replace('skill-', '');
                    const val = parseInt(s.value);
                    skillsPayload[skillName] = val;
                    localStoreUpdate[`num_skill_${skillName}`] = val;
                });

                const response = await userService.saveSkills(skillsPayload);
                
                if (response.success) {
                    // Sincroniza store global
                    updateStore('user', { ...store.user, ...localStoreUpdate });
                    alert('Habilidades salvas com sucesso!');
                } else {
                    throw new Error(response.message || 'Erro do servidor');
                }

            } catch (err) {
                console.error(err);
                alert('Erro ao salvar: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i> SALVAR STATUS TÉCNICO';
            }
        };
    }
}
