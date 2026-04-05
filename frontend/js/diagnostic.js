/**
 * SPIN4ALL - Módulo de Diagnóstico Técnico
 * Gerencia a experiência de onboarding e mapeamento de skills do atleta.
 */

let currentDiagStep = 1;
const totalDiagSteps = 13;

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

function closeDiagnosticModal() {
    const modal = document.getElementById('diagnostic-modal');
    if (modal) modal.style.display = 'none';
    
    // Opcional: Resetar para o passo 1 ao fechar (BOLT: Reset de estado limpo)
    document.querySelectorAll('.diag-step').forEach(step => step.classList.remove('active'));
    currentDiagStep = 1;
    document.querySelector('.diag-step[data-step="1"]').classList.add('active');
    updateDiagProgress();
}

function nextDiagStep() {
    // BOLT: Validação de Obrigatoriedade
    const currentStepEl = document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input[type="hidden"]');
    
    let isStepComplete = true;
    inputs.forEach(input => {
        if (!input.value || input.value === '0') {
            isStepComplete = false;
        }
    });

    if (!isStepComplete) {
        alert('Opa! Selecione uma opção para continuar. Este dado é fundamental para o seu DNA Técnico! 🎾✨');
        return;
    }

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
    // Busca o container pai que engloba opções e o input hidden (ex: .diag-step ou .diag-options-grid)
    const container = el.closest('.diag-step') || el.parentElement;
    const input = container.querySelector(`input[type="hidden"]`) || el.parentElement.querySelector('input[type="hidden"]');
    
    // Remover seleção anterior apenas dentro do contexto do container (importante para o passo 13 que tem 2 inputs)
    // Se o elemento estiver em um grupo específico (ex: tempo vs nível), limpa apenas aquele grupo
    const group = el.parentElement;
    group.querySelectorAll('.diag-option').forEach(opt => opt.classList.remove('selected'));
    
    // Adicionar nova seleção
    el.classList.add('selected');
    
    // Prioriza o input dentro do grupo imediato (Passo 13), fallback para container do passo (Passos 1-11)
    const stepContainer = el.closest('.diag-step');
    const hiddenInput = group.querySelector('input[type="hidden"]') || (stepContainer ? stepContainer.querySelector('input[type="hidden"]') : null);
    
    if (hiddenInput) {
        hiddenInput.value = el.getAttribute('data-val');
        console.log(`[DIAG] Input ${hiddenInput.id} atualizado para: ${hiddenInput.value}`);
    }
}

async function finishDiag() {
    // BOLT: Validação Final de Segurança
    const currentStepEl = document.querySelector(`.diag-step[data-step="${currentDiagStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input[type="hidden"]');
    let isStepComplete = true;
    inputs.forEach(input => {
        if (!input.value || input.value === '0') {
            isStepComplete = false;
        }
    });

    if (!isStepComplete) {
        alert('Este último passo é o mais importante! Escolha todas as opções para finalizar seu DNA. 🎾🏆✨');
        return;
    }

    const btn = document.getElementById('diag-finish-btn');
    const originalText = btn.innerHTML;
    
    try {
        // Feedback visual imediato
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
        btn.style.opacity = '0.7';

        // 1. CAPTURA DE DADOS (Dentro do try para capturar erros de DOM)
        console.log('[DIAGNOSTIC] Iniciando extração de dados...');
        
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`[DIAG] Elemento #${id} não encontrado! Usando padrão.`);
                return 0;
            }
            return parseInt(el.value) || 0;
        };

        const mapping = {
            forehand: getVal('q1'),
            backhand: getVal('q2'),
            saque: getVal('q3'),
            consistency: getVal('q4'),
            ataque: getVal('q5'),
            defesa: getVal('q6'),
            controle: getVal('q7'),
            movimentacao: getVal('q8'),
            cozinhada: getVal('q18'),
            topspin: getVal('q19'),
            bloqueio: getVal('q20')
        };

        const answers = [
            mapping.forehand, mapping.backhand, mapping.saque, mapping.consistency,
            mapping.ataque, mapping.defesa, mapping.controle, mapping.movimentacao,
            mapping.cozinhada, mapping.topspin, mapping.bloqueio,
            getVal('q14'), // estilo
            getVal('q11'), // tempo pratica
            getVal('q12')  // nivel competitivo
        ];

        console.log('[DIAGNOSTIC] Dados extraídos com sucesso:', { mapping, answers });
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        const response = await apiFetch('/diagnostic/submit', {
            method: 'POST',
            body: JSON.stringify({ mapping, answers })
        });

        if (response.success) {
            // FECHAR MODAL IMEDIATAMENTE (Evita ficar por cima do alerta)
            document.getElementById('diagnostic-modal').style.display = 'none';
            
            Swal.fire({
                icon: 'success',
                title: 'Formulário Concluído!',
                text: 'Seu mapeamento tecnico foi feito e suas missões foram geradas!',
                background: '#060e1a',
                color: '#fff',
                confirmButtonColor: '#38bdf8'
            }).then(() => {
                window.location.reload(); 
            });
        } else {
            throw new Error(response.message || 'Erro ao processar diagnóstico.');
        }
    } catch (err) {
        console.error('[DIAG ERROR] Falha no fluxo:', err);
        
        let errorMsg = 'Não conseguimos salvar seu diagnóstico. ';
        if (err.message) errorMsg += `\nDetalhe: ${err.message}`;

        Swal.fire({
            icon: 'error',
            title: 'Erro ao Salvar',
            text: errorMsg,
            background: '#060e1a',
            color: '#fff',
            confirmButtonColor: '#f43f5e'
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
    // DESATIVADO: Agora o diagnóstico é acessado via Card estratégico no Dashboard
}
