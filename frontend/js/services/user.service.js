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

    // Busca dados de frequência e check-ins do usuário por período opcional
    async getAttendance(month, year) {
        let url = '/my-attendance';
        if (month && year) url += `?month=${month}&year=${year}`;
        return await apiFetch(url);
    },

    async getEvolution() {
        return await apiFetch('/my-evolution');
    },

    async getSkills() {
        try {
            const res = await this.getUser();
            if (res && res.success && res.user) {
                const u = res.user;
                // Mapear as colunas individuais para o formato de array que a Home espera
                const skillsArray = [
                    { dsc_habilidade: 'Forehand', num_nivel: u.num_skill_forehand || 0 },
                    { dsc_habilidade: 'Backhand', num_nivel: u.num_skill_backhand || 0 },
                    { dsc_habilidade: 'Saque', num_nivel: u.num_skill_saque || 0 },
                    { dsc_habilidade: 'Rally', num_nivel: u.num_skill_rally || 0 },
                    { dsc_habilidade: 'Ataque', num_nivel: u.num_skill_ataque || 0 },
                    { dsc_habilidade: 'Defesa', num_nivel: u.num_skill_defesa || 0 },
                    { dsc_habilidade: 'Controle', num_nivel: u.num_skill_controle || 0 },
                    { dsc_habilidade: 'Movimentação', num_nivel: u.num_skill_movimentacao || 0 }
                ];
                return { success: true, skills: skillsArray };
            }
            return { success: false, skills: [] };
        } catch (err) {
            console.error('[SERVICE] getSkills error:', err);
            return { success: false, skills: [] };
        }
    }
};
