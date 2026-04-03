import { loadPage, getElement } from './js/utils/dom.js';
import { userService } from './js/services/user.service.js';
import { store, updateStore } from './js/state/store.js';
import './js/modules/profile-modal.js';

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
    } catch (e) {
        console.error('Fatal loadPage:', e);
    }
});

/**
 * Renders user info in the Global Header (Shell)
 */
function renderShellUser(user) {
    const welcomeEl = document.getElementById('user-welcome');
    const xpEl = document.getElementById('user-xp-val');
    const progressEl = document.getElementById('user-xp-progress-bar');
    const photoImg = document.getElementById('user-photo-img');
    const photoPlaceholder = document.getElementById('user-photo-placeholder');
    const emailEl = document.getElementById('user-email');
    const levelEl = document.getElementById('user-level-badge');
    const adminBadge = document.getElementById('admin-badge');

    if (welcomeEl) welcomeEl.textContent = `Olá, ${user.dsc_nome_completo.split(' ')[0]}!`;
    if (emailEl) emailEl.textContent = user.dsc_email;
    if (levelEl) levelEl.textContent = user.dsc_nivel_tecnico || 'INICIANTE';
    if (xpEl) xpEl.textContent = user.num_xp || 0;
    
    if (progressEl) {
        const xp = user.num_xp || 0;
        const pct = Math.min(100, (xp % 1000) / 10);
        progressEl.style.width = `${pct}%`;
    }

    if (photoImg && photoPlaceholder) {
        if (user.dsc_foto_perfil) {
            photoImg.src = user.dsc_foto_perfil;
            photoImg.style.display = 'block';
            photoPlaceholder.style.display = 'none';
        } else {
            photoImg.style.display = 'none';
            photoPlaceholder.style.display = 'block';
        }
    }

    // Toggle Admin Tabs
    const adminNav = document.getElementById('admin-nav-item');
    const monitoringNav = document.getElementById('admin-monitoring-nav');
    const boltNav = document.getElementById('admin-bolt-nav');

    if (user.flg_admin) {
        if (adminNav) adminNav.style.display = 'block';
        if (monitoringNav) monitoringNav.style.display = 'block';
        if (boltNav) boltNav.style.display = 'block';
        if (adminBadge) adminBadge.style.display = 'block';
    } else {
        if (adminBadge) adminBadge.style.display = 'none';
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

window.renderShellUser = renderShellUser;
