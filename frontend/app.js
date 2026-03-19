import { loadPage, getElement } from './js/utils/dom.js';
import { userService } from './js/services/user.service.js';
import { store, updateStore } from './js/state/store.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if token exists
    const token = localStorage.getItem('spin4all_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize Shell Components (Carousel)
    initSponsorCarousel();
    
    // 3. Fetch User Data to Populate Header
    try {
        const response = await userService.getUser();
        if (response.success) {
            updateStore('user', response.user);
            renderShellUser(response.user);
        }
    } catch (err) {
        console.error('[SHELL] Erro ao carregar usuário:', err);
    }

    // 4. Load Initial Page (Home)
    loadPage('home');
});

/**
 * Renders user info in the Global Header (Shell)
 */
function renderShellUser(user) {
    const welcomeEl = getElement('user-welcome');
    const emailEl = getElement('user-email');
    const levelEl = getElement('user-level-badge');
    const photoImg = getElement('user-photo-img');
    const photoIcon = photoImg?.previousElementSibling; // Ícone de fallback

    if (welcomeEl) welcomeEl.textContent = `Olá, ${user.dsc_nome_completo.split(' ')[0]}!`;
    if (emailEl) emailEl.textContent = user.dsc_email;
    if (levelEl) levelEl.textContent = user.dsc_nivel_tecnico || 'INICIANTE';

    // Foto de Perfil
    if (user.dsc_foto_perfil && photoImg) {
        photoImg.src = user.dsc_foto_perfil;
        photoImg.style.display = 'block';
        if (photoIcon) photoIcon.style.display = 'none';
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
        slide.style.background = sponsor.bg;
        slide.innerHTML = `
            <div class="sponsor-name">${sponsor.nome}</div>
            <div class="sponsor-url">${sponsor.url}</div>
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
