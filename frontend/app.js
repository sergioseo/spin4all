import { loadPage, getElement } from './js/utils/dom.js';
import { userService } from './js/services/user.service.js';
import { store, updateStore } from './js/state/store.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[SHELL] DOMContentLoaded - Starting App...');
    // 1. Check if token exists
    const token = localStorage.getItem('spin4all_token');
    if (!token) {
        console.warn('[SHELL] No token found, redirecting to login.');
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize Shell Components (Carousel)
    console.log('[SHELL] Initializing components...');
    initSponsorCarousel();
    
    // 3. Fetch User Data to Populate Header
    console.log('[SHELL] Fetching user profile...');
    try {
        const response = await userService.getUser();
        console.log('[SHELL] User response:', response.success ? 'Success' : 'Failed');
        if (response.success) {
            // 2.1 Enforce Bio-Mechanical Profile Completion
            if (response.user.flg_perfil_concluido === false) {
                console.warn('[SHELL] Profile incomplete, redirecting to profile sequence.');
                window.location.href = 'login.html'; // Login will detect incomplete profile and show step-profile
                return;
            }

            updateStore('user', response.user);
            
            // Renderização segura do cabeçalho
            try { 
                console.log('[SHELL] Rendering header...');
                renderShellUser(response.user); 
            } catch (e) { console.error('[SHELL] Error rendering header:', e); }

            // Início seguro do diagnóstico
            try {
                if (typeof checkDiagnosticRequirement === 'function') {
                    console.log('[SHELL] Checking diagnostic requirements...');
                    checkDiagnosticRequirement(response.user);
                }
            } catch (e) { console.error('[SHELL] Error in diagnostic check:', e); }
        }
    } catch (err) {
        console.error('[SHELL] Fatal error fetching user:', err);
        if (window.Swal) {
            Swal.fire({
                title: 'Erro de Conexão 🌐',
                text: 'Não conseguimos falar com o servidor. Verifique se o backend está rodando!',
                icon: 'warning',
                background: '#060e1a',
                color: '#fff'
            });
        }
    }

    // 4. Load Initial Page (Home) - Independente do sucesso do cabeçalho
    try {
        await loadPage('home');
        console.log('[DEBUG] Dashboard Initialized!');
        // Confirmação na tela para depuração (opcional, remover depois)
        if (window.Toastify) {
            Toastify({ text: "Dashboard Conectado!", duration: 2000, gravity: "top", position: "right", backgroundColor: "#00d4ff" }).showToast();
        }
    } catch (e) {
        console.error('Fatal loadPage:', e);
    }
});

/**
 * Renders user info in the Global Header (Shell)
 */
function renderShellUser(user) {
    const welcomeEl = getElement('user-welcome');
    const emailEl = getElement('user-email');
    const levelEl = getElement('user-level-badge');
    const adminEl = getElement('user-admin-badge');
    const xpBar = getElement('user-xp-bar');
    const xpText = getElement('user-xp-text');
    const photoImg = getElement('user-photo-img');
    const photoPlaceholder = getElement('user-photo-placeholder');

    if (welcomeEl) {
        const fullName = user.dsc_nome_completo || 'Membro';
        const firstName = fullName.split(' ')[0];
        welcomeEl.textContent = `Olá, ${firstName}!`;
    }
    if (emailEl) emailEl.textContent = user.dsc_email;
    
    // Selo de Administrador (Destaque Dourado)
    if (adminEl) {
        adminEl.style.display = user.flg_admin ? 'block' : 'none';
    }

    if (levelEl) {
        levelEl.textContent = user.dsc_nivel_tecnico || 'INICIANTE';
        levelEl.style.display = 'block';
    }

    // Progressão de XP - Visual de RPG Premium
    if (xpBar && xpText) {
        const currentXP = 0; 
        const nextLevelXP = 1000;
        const pct = (currentXP / nextLevelXP) * 100;
        xpBar.style.width = `${pct}%`;
        xpText.textContent = `XP ${currentXP}/${nextLevelXP}`;
    }

    // Gerenciamento de Foto com Glow Halo
    if (user.dsc_foto_perfil && photoImg) {
        photoImg.src = user.dsc_foto_perfil;
        photoImg.style.display = 'block';
        if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    } else if (photoPlaceholder) {
        photoPlaceholder.style.display = 'flex';
        if (photoImg) photoImg.style.display = 'none';
    }
}


// --- Shell Logic: Sponsors ---
const sponsorData = [
    { nome: "PATROCINADOR 1", url: "www.patrocinador1.com.br", bg: "#0d2137" },
    { nome: "PATROCINADOR 2", url: "www.patrocinador2.com.br", bg: "#12203a" },
    { nome: "PATROCINADOR 3", url: "www.patrocinador3.com.br", bg: "#0a1a2e" }
];

let currentSponsorIndex = 0;

function initSponsorCarousel() {
    const container = document.getElementById('sponsor-carousel');
    if (!container) return;

    sponsorData.forEach((sponsor, idx) => {
        const slide = document.createElement('div');
        slide.className = `sponsor-slide ${idx === 0 ? 'active' : ''}`;
        slide.style.background = `linear-gradient(135deg, ${sponsor.bg} 0%, #060e1a 100%)`;
        slide.innerHTML = `
            <div class="sponsor-label">Parceiro Oficial</div>
            <div class="sponsor-name">${sponsor.nome}</div>
            <a href="https://${sponsor.url}" target="_blank" class="sponsor-cta">
                Visitar Website <i class="fas fa-external-link-alt" style="font-size: 10px;"></i>
            </a>
        `;
        container.appendChild(slide);
    });

    setInterval(() => {
        const slides = document.querySelectorAll('.sponsor-slide');
        if (slides.length === 0) return;
        slides[currentSponsorIndex].classList.remove('active');
        currentSponsorIndex = (currentSponsorIndex + 1) % slides.length;
        slides[currentSponsorIndex].classList.add('active');
    }, 5000);
}

/** Global functions exposed for legacy triggers ***/
window.logout = () => {
    localStorage.removeItem('spin4all_token');
    window.location.href = 'login.html';
};

window.openTournamentModal = () => {
    const modal = document.getElementById('tournamentModal');
    if (modal) modal.style.display = 'flex';
};

window.closeTournamentModal = () => {
    const modal = document.getElementById('tournamentModal');
    if (modal) modal.style.display = 'none';
};

window.handleUnderstood = () => {
    window.closeTournamentModal();
};
