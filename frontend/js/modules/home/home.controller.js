import { userService } from '../../services/user.service.js';
import { communityService } from '../../services/community.service.js';
import { store, updateStore } from '../../state/store.js';
import { homeView } from './home.view.js';
import { apiFetch } from '../../services/api.js';

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

        // 3. Load Technical Skills & Evolution (ATO 2)
        console.log('[DEBUG-HOME] Loading ATO 2 (Skills & Chart)...');
        try {
            const skillsData = await userService.getSkills();
            if (skillsData && skillsData.success && skillsData.skills && skillsData.skills.length > 0) {
                homeView.renderSkills(skillsData.skills);
                renderEvolution(skillsData.skills);
            } else {
                console.warn('[HOME] No skills found or error loading.');
                const list = document.getElementById('skills-list');
                if (list) list.innerHTML = '<div style="color: var(--text-label); font-size: 0.7rem; text-align: center; padding: 10px;">Sem dados técnicos.</div>';
            }
        } catch (err) {
            console.error('[CRITICAL] Skills load failed:', err);
        }

        // 4. Load Calendar and Frequency
        console.log('[DEBUG-HOME] Loading calendar component...');
        try {
            await loadCalendar(currentViewMonth, currentViewYear);
        } catch (err) {
            console.error('[CRITICAL] Calendar load failed:', err);
        }

        // 5. Load Weekly Missions
        fetchMissions();

        setupEventListeners();

    } catch (err) {
        console.error('[HOME CONTROLLER ERROR]:', err);
    }
}

async function fetchMissions() {
    try {
        const response = await apiFetch('/missions/current');
        if (response.success) {
            homeView.renderMissions(response.data);
        }
    } catch (err) {
        console.error('Erro ao buscar missões:', err);
    }
}

// Global handler for missions
window.handleToggleMission = async (id, currentStatus) => {
    if (currentStatus) return; // Already done

    try {
        const response = await apiFetch('/missions/complete', {
            method: 'POST',
            body: JSON.stringify({ id_missao: id })
        });

        if (response.success) {
            Swal.fire({
                title: 'Meta Batida! 🎯',
                text: `Você ganhou +${response.xp_ganho} XP!`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#060e1a',
                color: '#fff'
            });
            fetchMissions();
        }
    } catch (err) {
        console.error('Erro ao completar missão:', err);
    }
};

async function loadCalendar(month, year) {
    // Unificamos a chamada: getAttendance agora retorna tanto as estatísticas quanto o array de datas (check-ins)
    const attData = await userService.getAttendance(month, year);
    if (attData.success) {
        // Detectar se o mês já foi concluído para mudar a mensagem do selo
        const today = new Date();
        const isPastMonth = (year < today.getFullYear()) || (year === today.getFullYear() && month < (today.getMonth() + 1));

        // 1. Renderiza o grid do calendário com as datas de check-in
        homeView.renderCalendar(month, year, attData.dates || []);
        
        // 2. Atualiza o mostrador de percentual, contagem (X de Y) e selo de qualificação
        homeView.updateFrequency(attData.stats, isPastMonth, store.user);
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

function renderEvolution(skills) {
    const filters = document.getElementById('skill-filters');
    if (!filters) return;

    // Skill Filter Buttons
    filters.innerHTML = skills.map((s, i) => `
        <button class="skill-btn ${i === 0 ? 'active-eu' : ''}" 
                style="font-size: 8px; padding: 2px 8px; border-radius: 8px; border: 1px solid var(--border-ui); background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;"
                onclick="window.selectHomeSkill('${s.dsc_habilidade}')" 
                data-skill="${s.dsc_habilidade}">
            ${s.dsc_habilidade}
        </button>
    `).join('');

    // Chart Data Mock (as per Scenario 2: Mock First)
    const mockChartData = {
        'Topspin':     { eu:[48,54,58,62,66,70,72], com:[52,53,54,55,55,56,57] },
        'Backhand':    { eu:[42,40,39,38,37,36,34], com:[44,45,46,46,47,47,48] },
        'Forehand':    { eu:[40,41,42,43,44,45,45], com:[48,49,50,51,51,51,52] },
        'Controle':    { eu:[68,72,75,78,80,81,83], com:[60,61,61,62,63,63,64] },
    };

    window.selectHomeSkill = (skillName) => {
        document.querySelectorAll('.skill-btn').forEach(b => {
            b.style.borderColor = 'var(--border-ui)';
            b.style.color = 'var(--text-muted)';
            b.style.background = 'transparent';
            if (b.dataset.skill === skillName) {
                b.style.borderColor = 'var(--accent-cyan)';
                b.style.color = 'var(--accent-cyan)';
                b.style.background = 'rgba(0, 229, 255, 0.09)';
            }
        });
        
        // Use real skill level for the last data point if available
        const skill = skills.find(s => s.dsc_habilidade === skillName);
        const chartData = mockChartData[skillName] || { eu:[50,50,50,50,55,60,65], com:[52,53,54,55,56,57,58] };
        if (skill) chartData.eu[chartData.eu.length - 1] = skill.num_nivel;

        homeView.drawEvolutionChart(skillName, chartData);
    };

    // Initial draw
    if (skills.length > 0) window.selectHomeSkill(skills[0].dsc_habilidade);
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
