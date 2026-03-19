import { apiFetch } from './api.js';

export const userService = {
    // Busca os dados do usuário logado
    async getUser() {
        return await apiFetch('/me');
    },

    // Alias para compatibilidade
    async getCurrentUser() {
        return this.getUser();
    },

    // Salva qualquer alteração no perfil (peso, altura, objetivo, skills, etc)
    async updateProfile(data) {
        return await apiFetch('/update-profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async saveSkills(skills) {
        return this.updateProfile({ skills });
    },

    // Busca dados de frequência e check-ins do usuário
    async getAttendance() {
        return await apiFetch('/my-attendance');
    }
};
