export const homeView = {
    updateFrequency(stats) {
        console.log('[DEBUG-VIEW] Setting frequency pct:', stats.pct_frequencia);
        const pct = stats.pct_frequencia || 0;
        const circle = document.getElementById('frequency-progress');
        const radius = 54; 
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        
        if (circle) circle.style.strokeDashoffset = offset;
        const freqPctEl = document.getElementById('frequency-pct');
        if (freqPctEl) freqPctEl.textContent = pct;

        const statusDiv = document.getElementById('tournament-status');
        if (statusDiv) {
            if (pct >= 60) {
                statusDiv.textContent = 'QUALIFICADO PARA TORNEIOS';
                statusDiv.className = 'qualification-status status-ok';
            } else {
                statusDiv.textContent = 'PENDENTE DE QUALIFICAÇÃO';
                statusDiv.className = 'qualification-status status-pending';
            }
        }
        
        const btnSaibaMais = document.getElementById('btn-saiba-mais');
        const btnInscricao = document.getElementById('btn-inscricao-real');
        if (pct >= 60) {
            if (btnSaibaMais) btnSaibaMais.style.display = 'none';
            if (btnInscricao) btnInscricao.style.display = 'block';
        } else {
            if (btnSaibaMais) btnSaibaMais.style.display = 'block';
            if (btnInscricao) btnInscricao.style.display = 'none';
        }
    },

    renderCalendar(month, year, presentDates) {
        const grid = document.getElementById('attendance-calendar-grid');
        if (!grid) return;

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const monthYearEl = document.getElementById('calendar-month-year');
        if (monthYearEl) monthYearEl.textContent = `${monthNames[month - 1]} ${year}`;

        const labels = Array.from(grid.querySelectorAll('.day-label'));
        grid.innerHTML = '';
        labels.forEach(l => grid.appendChild(l));

        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPresent = presentDates.some(d => d.split('T')[0] === dateStr);

            const dayEl = document.createElement('div');
            dayEl.className = `day-dot ${isPresent ? 'present' : ''}`;
            dayEl.textContent = day;
            grid.appendChild(dayEl);
        }
    },

    renderTournamentsRanking(ranking) {
        const list = document.getElementById('ranking-list');
        if (!list) return;

        if (ranking.length === 0) {
            list.innerHTML = '<div style="color: #64748b; font-size: 0.8rem; text-align: center; padding: 20px;">Nenhum resultado recente.</div>';
            return;
        }

        list.innerHTML = ranking.map((player, index) => {
            const medal = index === 0 ? '<i class="fas fa-medal" style="color: #fbbf24;"></i>' :
                index === 1 ? '<i class="fas fa-medal" style="color: #94a3b8;"></i>' :
                    index === 2 ? '<i class="fas fa-medal" style="color: #b45309;"></i>' :
                        `<span style="width: 20px; text-align: center; font-weight: 800; color: #64748b;">${index + 1}º</span>`;

            return `
                <div class="ranking-item-compact">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 25px; display: flex; justify-content: center;">${medal}</div>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #f8fafc;">${player.dsc_nome_completo}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: #38bdf8; font-weight: 800;">${player.total_pontos || 0}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEvolutionRanking(ranking) {
        const list = document.getElementById('evolution-list');
        if (!list) return;
        list.innerHTML = ranking.map(p => `
            <div class="ranking-item-compact">
                <span style="font-size: 0.85rem; font-weight: 600; color: #f8fafc;">${p.dsc_nome_completo}</span>
                <span style="font-size: 0.8rem; color: #4ade80; font-weight: 800;">+${p.num_evolucao || 0}%</span>
            </div>
        `).join('') || '<div style="color: #64748b; font-size: 0.7rem; text-align: center;">Vazio</div>';
    },

    renderAttendanceRanking(ranking) {
        const list = document.getElementById('attendance-ranking-list');
        if (!list) return;
        list.innerHTML = ranking.map(p => `
            <div class="ranking-item-compact">
                <span style="font-size: 0.85rem; font-weight: 600; color: #f8fafc;">${p.dsc_nome_completo}</span>
                <span style="font-size: 0.8rem; color: #a855f7; font-weight: 800;">${p.total_treinos || 0} pts</span>
            </div>
        `).join('') || '<div style="color: #64748b; font-size: 0.7rem; text-align: center;">Vazio</div>';
    },

    renderCommunityStats(data) {
        const activeEl = document.getElementById('community-active-count');
        const focusEl = document.getElementById('community-main-focus');
        const progEl = document.getElementById('community-progression-rate');
        const activityList = document.getElementById('community-activity-list');

        if (activeEl) activeEl.textContent = data.active_today || 0;
        if (focusEl) focusEl.textContent = data.main_focus;
        if (progEl) progEl.textContent = `${data.progression_rate || 0}%`;

        if (activityList && data.recent_activity) {
            activityList.innerHTML = data.recent_activity.map(act => `
                <div style="display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: #cbd5e1; padding: 5px 0;">
                    <i class="fas ${act.dsc_icone || 'fa-medal'}" style="color: #fbbf24; font-size: 0.8rem;"></i>
                    <span><strong>${act.dsc_nome_completo.split(' ')[0]}</strong> conquistou ${act.dsc_nome}</span>
                </div>
            `).join('') || '<div style="color: #64748b; font-size: 0.7rem;">Nenhuma atividade recente</div>';
        }
    }
};
