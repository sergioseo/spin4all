import { CONFIG } from '../config.js';

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('spin4all_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const response = await fetch(`${CONFIG.API_URL}${path}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific errors like 401
            if (response.status === 401) {
                localStorage.removeItem('spin4all_token');
                window.location.href = 'login.html';
            }
            throw new Error(data.message || 'API Error');
        }

        return data;
    } catch (error) {
        console.error(`[API ERROR] ${path}:`, error);
        throw error;
    }
}
