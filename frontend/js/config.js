const API_URL = (window.location.hostname.includes('spin4all.com.br'))
    ? 'https://spin4all-motor.h5rvsp.easypanel.host/api'
    : 'http://localhost:3000/api';

export const CONFIG = {
    API_URL,
    ATTENDANCE_TARGET: 12,
    CACHE_DURATION: 1000 * 60 * 5, // 5 minutes
};
