import { userService } from '../../services/user.service.js';
import { communityService } from '../../services/community.service.js';
import { store, updateStore } from '../../state/store.js';
import { homeView } from './home.view.js';

let currentViewMonth = new Date().getMonth() + 1;
let currentViewYear = new Date().getFullYear();

export async function init() {
    try {
        console.log('[HOME CONTROLLER] Initializing...');
        
        // 1. Get User Data
        const userData = await userService.getUser();
        updateStore('user', userData.user);
        homeView.renderUserHeader(userData.user);

        // 2. Get and Render Frequency/Calendar
        await loadCalendar(currentViewMonth, currentViewYear);

        // 3. Community Stats
        const stats = await communityService.getStats();
        updateStore('communityStats', stats.data);
        homeView.renderCommunityStats(stats.data);

        // 4. Ranking
        const rankingData = await communityService.getHallFama();
        updateStore('hallFama', rankingData.ranking);
        homeView.renderRanking(rankingData.ranking);

        // Set up event listeners unique to home
        setupEventListeners();

    } catch (err) {
        console.error('[HOME CONTROLLER ERROR]:', err);
    }
}

async function loadCalendar(month, year) {
    const data = await communityService.getAttendanceCalendar(month, year);
    if (data.success) {
        homeView.renderCalendar(month, year, data.dates);
        
        const now = new Date();
        if (month === now.getMonth() + 1 && year === now.getFullYear()) {
            const target = 12; // Example target
            const pct = Math.min(Math.round((data.dates.length / target) * 100), 100);
            homeView.updateFrequency(pct);
        }
    }
}

function setupEventListeners() {
    const btnPrev = document.getElementById('btn-prev-month');
    const btnNext = document.getElementById('btn-next-month');

    if (btnPrev) {
        btnPrev.onclick = () => {
            currentViewMonth--;
            if (currentViewMonth < 1) { currentViewMonth = 12; currentViewYear--; }
            loadCalendar(currentViewMonth, currentViewYear);
        };
    }

    if (btnNext) {
        btnNext.onclick = () => {
            currentViewMonth++;
            if (currentViewMonth > 12) { currentViewMonth = 1; currentViewYear++; }
            loadCalendar(currentViewMonth, currentViewYear);
        };
    }
}
