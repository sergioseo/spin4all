import { userService } from '../services/user.service.js';
import { store } from '../state/store.js';

/**
 * SPIN4ALL - Módulo de Perfil Bio-Mecânico (Formulário Inicial)
 * Gerencia a visualização e edição dos dados biográficos do atleta.
 */

window.openProfileModal = async function() {
    console.log('[PROFILE] Abrindo modal biomecânico...');
    const modal = document.getElementById('initial-profile-modal');
    if (!modal) {
        console.error('[PROFILE] Erro: Modal initial-profile-modal não encontrado!');
        return;
    }

    // Feedback visual de carregamento
    const btnSave = document.getElementById('btn-save-profile');
    if (btnSave) btnSave.disabled = true;

    try {
        // Tenta pegar do store, se não houver ou estiver incompleto, busca do servidor
        let user = store.user;
        if (!user || !user.dsc_nome_completo) {
            const res = await userService.getUser();
            if (res.success) user = res.user;
        }

        if (user) {
            document.getElementById('profile-name').value = user.dsc_nome_completo || '';
            document.getElementById('profile-height').value = user.num_altura_cm || '';
            document.getElementById('profile-weight').value = user.num_peso_kg || '';
            document.getElementById('profile-phone').value = user.dsc_telefone || '';
            
            if (user.dat_nascimento) {
                // Formatar data para YYYY-MM-DD para o input type="date"
                const date = new Date(user.dat_nascimento);
                if (!isNaN(date.getTime())) {
                    document.getElementById('profile-birth').value = date.toISOString().split('T')[0];
                }
            }
        }

        modal.style.display = 'flex';
    } catch (err) {
        console.error('[PROFILE] Erro ao carregar dados do usuário:', err);
    } finally {
        if (btnSave) btnSave.disabled = false;
    }
};

window.closeProfileModal = function() {
    const modal = document.getElementById('initial-profile-modal');
    if (modal) modal.style.display = 'none';
};

// Event listener para o formulário
const profileForm = document.getElementById('initial-profile-form');
if (profileForm) {
    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        const originalText = btn.textContent;
        
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const data = {
            name: document.getElementById('profile-name').value,
            height: parseInt(document.getElementById('profile-height').value),
            weight: parseInt(document.getElementById('profile-weight').value),
            birth: document.getElementById('profile-birth').value,
            phone: document.getElementById('profile-phone').value
        };

        try {
            const res = await userService.updateProfile(data);
            if (res.success) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Perfil Atualizado! 🏆',
                        text: 'Seus dados foram salvos. Sua evolução começa com dados precisos!',
                        background: '#060e1a',
                        color: '#fff',
                        confirmButtonText: 'Excelente!',
                        confirmButtonColor: '#38bdf8'
                    }).then(() => {
                        window.closeProfileModal();
                        window.location.reload(); // Recarrega para atualizar cabeçalho e store
                    });
                } else {
                    alert('Perfil atualizado com sucesso!');
                    window.closeProfileModal();
                    window.location.reload();
                }
            } else {
                throw new Error(res.message || 'Erro ao salvar perfil.');
            }
        } catch (err) {
            console.error('[PROFILE] Erro ao salvar:', err);
            if (window.Swal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ops! Algo deu errado',
                    text: err.message,
                    background: '#060e1a',
                    color: '#fff'
                });
            } else {
                alert('Erro: ' + err.message);
            }
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };
}
