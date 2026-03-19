/**
 * Specialized DOM Utility for SPA Navigation and Manipulation
 */
export const getElement = (id) => document.getElementById(id);

export async function loadPage(page) {

    const appContainer = document.getElementById('app');
    const loader = document.getElementById('app-loader'); // Novo elemento de carregamento
    
    if (!appContainer) {
        console.error('[loadPage] #app container not found!');
        return;
    }

    try {
        console.log(`[DOM] Loading page: ${page}`);
        
        // 1. Show Loader
        if (loader) loader.classList.add('visible');
        appContainer.classList.add('loading-fade'); // Efeito de fade out

        // 2. Fetch HTML chunk
        const response = await fetch(`./pages/${page}.html`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const html = await response.text();
        appContainer.innerHTML = html;

        // 3. Load Controller and Init
        const module = await import(`../modules/${page}/${page}.controller.js`);
        
        // Verifica se é export default ou export function init()
        const initFn = module.default || module.init;
        
        if (typeof initFn === 'function') {
            await initFn();
        } else {
            console.warn(`[DOM] Module for ${page} has no valid init() or default function.`);
        }

    } catch (err) {
        console.error(`[DOM] Error loading page ${page}:`, err);
        appContainer.innerHTML = `<div class="glass-card"><div class="card-title"><i class="fas fa-exclamation-triangle"></i> Erro ao Carregar</div><p>Desculpe, não conseguimos carregar "${page}" no momento.</p></div>`;
    } finally {
        // Hide Loader
        if (loader) loader.classList.remove('visible');
        appContainer.classList.remove('loading-fade');
    }
}

/**
 * Handle Tab Switching in the Shell
 */
window.navTo = (page) => {
    // 1. UI Feedback: Update Active Menu Item
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // Suporte para múltiplos links que apontam para a mesma página
    const navItems = document.querySelectorAll(`[id="nav-${page}"]`);
    navItems.forEach(item => item.classList.add('active'));

    // 2. Load the Page
    loadPage(page);
};

