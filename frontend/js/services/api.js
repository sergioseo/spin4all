import { CONFIG } from '../config.js';

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('spin4all_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    // Configurar Timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
        // Garantir que a URL não tenha barras duplas ou falte a barra entre base e path
        const baseUrl = CONFIG.API_URL.endsWith('/') ? CONFIG.API_URL.slice(0, -1) : CONFIG.API_URL;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const querySep = cleanPath.includes('?') ? '&' : '?';
        const fullUrl = `${baseUrl}${cleanPath}${querySep}t=${Date.now()}`;

        const response = await fetch(fullUrl, {
            ...options,
            headers,
            signal: controller.signal // Conectar o sinal de aborto
        });

        clearTimeout(timeoutId); // Limpar timeout se responder a tempo

        const data = await response.json();

        if (!response.ok) {
            // Handle specific errors like 401/403 (Auth/Token issues)
            if (response.status === 401 || response.status === 403) {
                console.warn('[API] Auth failed. Cleaning store and redirecting to login...');
                localStorage.removeItem('spin4all_token');
                window.location.href = 'login.html';
            }
            throw new Error(data.message || 'API Error');
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[API TIMEOUT] ${path}: A requisição excedeu 15 segundos.`);
            throw new Error('Servidor demorou muito para responder. Tente novamente.');
        }
        console.error(`[API ERROR] ${path}:`, error);
        throw error;
    }
}

// Tornar global para scripts não-modulares (como diagnostic.js)
window.apiFetch = apiFetch;
