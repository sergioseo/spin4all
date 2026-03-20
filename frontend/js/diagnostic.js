/**
 * SPIN4ALL - Módulo de Diagnóstico Técnico
 * Gerencia a experiência de onboarding e mapeamento de skills do atleta.
 */

let currentDiagStep = 1;
const totalDiagSteps = 10;

function updateDiagProgress() {
    const pct = (currentDiagStep / totalDiagSteps) * 100;
    const bar = document.getElementById('diag-progress-bar');
    if (bar) bar.style.width = pct + '%';

    // Alternar visibilidade de botões
    const prevBtn = document.getElementById('diag-prev-btn');
    const nextBtn = document.getElementById('diag-next-btn');
    const finishBtn = document.getElementById('diag-finish-btn');
    
    // Esconder anterior no primeiro passo
    if (prevBtn) prevBtn.style.display = (currentDiagStep === 1) ? 'none' : 'block';

    if (currentDiagStep === totalDiagSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'block';
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (finishBtn) finishBtn.style.display = 'none';
    }
}

function nextDiagStep() {
    if (currentDiagStep < totalDiagSteps) {
        document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`).classList.remove('active');
        currentDiagStep++;
        document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`).classList.add('active');
        updateDiagProgress();
    }
}

function prevDiagStep() {
    if (currentDiagStep > 1) {
        document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`).classList.remove('active');
        currentDiagStep--;
        document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`).classList.add('active');
        updateDiagProgress();
    }
}

function selectDiagOption(el) {
    const parent = el.parentElement;
    const input = parent.querySelector('input[type="hidden"]');
    
    // Remover seleção anterior
    parent.querySelectorAll('.diag-option').forEach(opt => opt.classList.remove('selected'));
    
    // Adicionar nova seleção
    el.classList.add('selected');
    if (input) input.value = el.getAttribute('data-val');
}

async function finishDiag() {
    const mapping = {
        forehand: parseInt(document.getElementById('q1').value),
        backhand: parseInt(document.getElementById('q2').value),
        saque: parseInt(document.getElementById('q3').value),
        consistency: parseInt(document.getElementById('q4').value),
        ataque: parseInt(document.getElementById('q5').value),
        defesa: parseInt(document.getElementById('q6').value),
        controle: parseInt(document.getElementById('q7').value),
        movimentacao: parseInt(document.getElementById('q8').value)
    };

    const answers = [
        mapping.forehand, mapping.backhand, mapping.saque, mapping.consistency,
        mapping.ataque, mapping.defesa, mapping.controle, mapping.movimentacao,
        parseInt(document.getElementById('q9')?.value || 0),
        parseInt(document.getElementById('q10')?.value || 0),
        parseInt(document.getElementById('q11').value),
        parseInt(document.getElementById('q12').value),
        0, // placeholder para q13
        parseInt(document.getElementById('q14').value),
        0, 0, // placeholders para q15-q16
        parseInt(document.getElementById('q17')?.value || 0)
    ];

    const btn = document.getElementById('diag-finish-btn');
    const originalText = btn.innerHTML;
    
    try {
        // Feedback visual de carregamento
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btn.style.opacity = '0.7';

        console.log('[DIAGNOSTIC] Preparando envio de dados:', { mapping, answers });

        const response = await apiFetch('/diagnostic/submit', {
            method: 'POST',
            body: JSON.stringify({ mapping, answers })
        });

        if (response.success) {
            Swal.fire({
                icon: 'success',
                title: 'Diagnóstico Concluído!',
                text: 'Sua maestria técnica foi mapeada e suas missões foram geradas!',
                background: '#060e1a',
                color: '#fff',
                confirmButtonColor: '#38bdf8'
            }).then(() => {
                document.getElementById('diagnostic-modal').style.display = 'none';
                window.location.reload(); // Recarregar para atualizar radar e missões
            });
        } else {
            throw new Error(response.message || 'Erro ao processar diagnóstico.');
        }
    } catch (err) {
        console.error('Erro ao finalizar diagnóstico:', err);
        Swal.fire({
            icon: 'error',
            title: 'Ops! Algo deu errado',
            text: 'Não conseguimos salvar seu diagnóstico. Tente novamente em instantes.',
            background: '#060e1a',
            color: '#fff'
        });
        
        // Reset do botão em caso de erro
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
    }
}

// Controlador Global de Modais
window.openDiagnosticModal = function() {
    const modal = document.getElementById('diagnostic-modal');
    if (!modal) {
        console.error('[DIAG] Erro: Modal de diagnóstico não encontrado no DOM!');
        return;
    }

    // Resetar para o primeiro passo sempre que abrir
    currentDiagStep = 1;
    document.querySelectorAll('.diag-step').forEach(step => step.classList.remove('active'));
    
    const firstStep = modal.querySelector('.diag-step[data-step="1"]');
    if (firstStep) firstStep.classList.add('active');

    modal.style.display = 'flex';
    updateDiagProgress();
    console.log('[DIAG] Modal aberto com sucesso (10 passos detectados).');
};

window.closeDiagnosticModal = function() {
    const modal = document.getElementById('diagnostic-modal');
    if (modal) modal.style.display = 'none';
};


// Abrir modal se necessário (Onboarding)
function checkDiagnosticRequirement(user) {
    if (!user.dsc_nivel_tecnico || user.dsc_nivel_tecnico === '--') {
        console.log('[DIAG] Usuário sem diagnóstico. Abrindo em 1.5s...');
        setTimeout(() => {
            window.openDiagnosticModal();
        }, 1500);
    }
}
