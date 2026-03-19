/**
 * Simple global store for state management.
 * In a future stage, we could use Proxy to auto-render components on state change.
 */
export const store = {
    user: null,
    hallFama: [],
    evolutionRanking: [],
    communityStats: null,
    attendanceRanking: [],
    attendanceCalendar: []
};

export function updateStore(key, value) {
    if (key in store) {
        store[key] = value;
        console.log(`[STORE UPDATED] ${key}:`, value);
    }
}
