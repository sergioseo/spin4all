import { userService } from '../../services/user.service.js';
import { communityService } from '../../services/community.service.js';
import { store, updateStore } from '../../state/store.js';
import { homeView } from './home.view.js';

let currentViewMonth = new Date().getMonth() + 1;
let currentViewYear = new Date().getFullYear();

export async function init() {
    try {
        console.log('[HOME CONTROLLER] Initializing...');

        // 1. Load Community Stats
        console.log('[DEBUG-HOME] Fetching community stats...');
        try {
            const stats = await communityService.getStats();
            if (stats.success) {
                updateStore('communityStats', stats.data);
                homeView.renderCommunityStats(stats.data);
                renderWeeklyChart(stats.data.weekly_engagement);
            }
        } catch (err) {
            console.error('[CRITICAL] Stats load failed:', err);
        }

        // 2. Fill Rankings
        console.log('[DEBUG-HOME] Fetching rankings...');
        try {
            const hallResources = await Promise.all([
                communityService.getHallFama(),
                communityService.getEvolutionRanking(),
                communityService.getAttendanceRanking()
            ]);
            if (hallResources[0].success) homeView.renderTournamentsRanking(hallResources[0].ranking || []);
            if (hallResources[1].success) homeView.renderEvolutionRanking(hallResources[1].ranking || []);
            if (hallResources[2].success) homeView.renderAttendanceRanking(hallResources[2].ranking || []);
        } catch (err) {
            console.error('[CRITICAL] Rankings load failed:', err);
        }

        // 3. Load Calendar and Frequency
        console.log('[DEBUG-HOME] Loading calendar component...');
        try {
            await loadCalendar(currentViewMonth, currentViewYear);
        } catch (err) {
            console.error('[CRITICAL] Calendar load failed:', err);
        }

        setupEventListeners();

    } catch (err) {
        console.error('[HOME CONTROLLER ERROR]:', err);
    }
}

async function loadCalendar(month, year) {
    const data = await communityService.getAttendanceCalendar(month, year);
    if (data.success) {
        homeView.renderCalendar(month, year, data.dates);
        
        // Update Frequency for Current Month
        const now = new Date();
        if (month === now.getMonth() + 1 && year === now.getFullYear()) {
            const attData = await userService.getAttendance();
            if (attData.success) {
                homeView.updateFrequency(attData.stats);
            }
        }
    }
}

function renderWeeklyChart(engagementData) {
    const canvas = document.getElementById('weeklyEngagementChart');
    if (!canvas || !engagementData) return;

    const ChartLib = window.Chart;
    if (!ChartLib) return;

    new ChartLib(canvas, {
        type: 'bar',
        data: {
            labels: engagementData.map(d => d.label),
            datasets: [{
                label: 'Presenças',
                data: engagementData.map(d => d.value),
                backgroundColor: '#38bdf8',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
                y: { display: false, beginAtZero: true }
            }
        }
    });
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
