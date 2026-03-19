export const homeView = {
    renderUserHeader(user) {
        document.getElementById('user-welcome').textContent = `Olá, ${user.dsc_nome_completo.split(' ')[0]}!`;
        document.getElementById('user-email').textContent = user.dsc_email;
        document.getElementById('user-level-badge').textContent = user.dsc_level || 'MEMBRO';
        
        if (user.dsc_foto_perfil) {
            const img = document.getElementById('user-photo-img');
            img.src = user.dsc_foto_perfil + '?t=' + new Date().getTime();
            img.style.display = 'block';
            const icon = document.querySelector('#user-profile-img-container i');
            if (icon) icon.style.display = 'none';
        }
    },

    updateFrequency(pct) {
        const circle = document.getElementById('frequency-progress');
        const radius = 54; // Adjusted to match SVG
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
        
        // Toggle buttons based on eligibility
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

        // Keep labels
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

    renderRanking(ranking) {
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
                        <div style="font-size: 0.9rem; color: #38bdf8; font-weight: 800;">${player.total_pontos}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderCommunityStats(data) {
        document.getElementById('community-active-count').textContent = data.active_today;
        document.getElementById('community-main-focus').textContent = data.main_focus || 'Treino Geral';
        
        const activityList = document.getElementById('community-activity-list');
        if (activityList) {
            activityList.innerHTML = data.recent_activity.map(act => `
                <div class="activity-item">
                    <i class="${act.dsc_icone || 'fas fa-medal'}" style="color: #fbbf24;"></i>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff;">${act.dsc_nome_completo}</div>
                        <div style="font-size: 0.7rem; color: #94a3b8;">${act.dsc_nome}</div>
                    </div>
                </div>
            `).join('') || '<div style="color: #64748b; font-size: 0.7rem; text-align: center;">Nenhuma atividade recente.</div>';
        }
    }
};
