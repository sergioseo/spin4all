import { apiFetch } from './api.js';

export const communityService = {
    getStats() {
        return apiFetch('/community/stats');
    },
    getAttendanceRanking() {
        return apiFetch('/community/attendance-ranking');
    },
    getHallFama() {
        return apiFetch('/user/hall-fama');
    },
    getEvolutionRanking() {
        return apiFetch('/user/evolution-ranking');
    },
    getAttendanceCalendar(month, year) {
        return apiFetch(`/user/attendance-calendar?month=${month}&year=${year}`);
    }
};
