export const homeView = {
    updateFrequency(stats, isPastMonth = false, user = null) {
        console.log('[DEBUG-VIEW] Setting frequency pct:', stats.pct_frequencia);
        const pct = stats.pct_frequencia || 0;
        
        // Atualiza a dinâmica do banner de torneio ou onboarding
        this.updateTournamentBanner(stats, user);

        const circle = document.getElementById('frequency-progress');
        const radius = 24; 
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        if (circle) {
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.transition = 'stroke-dashoffset 0.8s ease-out';
            circle.style.strokeDashoffset = offset;
        }
        const freqPctEl = document.getElementById('frequency-pct');
        if (freqPctEl) freqPctEl.textContent = pct;

        const countEl = document.getElementById('frequency-count-text');
        if (countEl) {
            countEl.textContent = `${stats.num_presencas} de ${stats.num_total_mes || 0} treinos`;
        }

        const statusDiv = document.getElementById('qualification-badge');
        if (statusDiv) {
            statusDiv.className = 'badge badge-premium'; 
            
            if (pct >= 60) {
                statusDiv.textContent = '✓ QUALIFICADO';
                statusDiv.classList.add('badge-qualified');
            } else if (isPastMonth) {
                statusDiv.textContent = 'NÃO ALCANÇADO';
                statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                statusDiv.style.color = '#f87171';
                statusDiv.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                statusDiv.style.boxShadow = 'none';
            } else {
                statusDiv.textContent = 'EM PROGRESSO';
                statusDiv.classList.add('badge-pending');
                statusDiv.style.boxShadow = 'none';
            }
        }
        
        const btnInscricao = document.getElementById('btn-inscricao-confirmada');
        if (btnInscricao) {
            if (pct >= 60) {
                btnInscricao.style.opacity = '1';
                btnInscricao.disabled = false;
                btnInscricao.style.cursor = 'pointer';
            } else {
                btnInscricao.style.opacity = '0.5';
                btnInscricao.disabled = true;
                btnInscricao.style.cursor = 'not-allowed';
            }
        }

        // Mock Streaks for now as per plan
        this.renderStreaks({ current: 17, record: 23, history: [1,1,1,1,1,1,2] });
    },

    renderStreaks(data) {
        const countEl = document.getElementById('streak-count');
        const recordEl = document.getElementById('streak-record');
        const dotsContainer = document.getElementById('streak-dots-container');
        const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        if (countEl) countEl.textContent = data.current;
        if (recordEl) recordEl.textContent = `${data.record} dias`;

        if (dotsContainer) {
            dotsContainer.innerHTML = data.history.map((status, idx) => {
                const isToday = idx === 6; // O último nó representa hoje
                const isActive = status === 1 || status === 2;
                const nodeClass = `streak-node ${isActive ? 'active-fire' : ''} ${isToday ? 'today-pulse' : ''}`;
                
                return `
                    <div class="${nodeClass}">
                        <i class="fas ${isActive ? 'fa-fire' : 'fa-circle'}" style="font-size: 10px;"></i>
                        <span class="node-day">${days[idx]}</span>
                    </div>
                `;
            }).join('');
        }
    },

    renderMissions(missions) {
        const list = document.getElementById('missions-list');
        if (!list) return;

        if (!missions || missions.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 15px; background: rgba(0, 212, 255, 0.05); border-radius: 10px;">
                    <p style="font-size: 11px; color: var(--accent-cyan); margin: 0;"><strong>Nenhuma missão ativa!</strong></p>
                    <p style="font-size: 9px; color: var(--text-muted);">Faça seu diagnóstico técnico para gerar metas.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = missions.map(m => `
            <div class="mission-item" style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; opacity: ${m.flg_concluida ? '0.5' : '1'};">
                <div class="mission-checkbox" onclick="handleToggleMission(${m.id_missao}, ${m.flg_concluida})" 
                     style="width: 18px; height: 18px; border: 2px solid ${m.flg_concluida ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)'}; 
                            border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: ${m.flg_concluida ? 'var(--accent-cyan)' : 'transparent'};">
                    ${m.flg_concluida ? '<i class="fas fa-check" style="font-size: 9px; color: #000;"></i>' : ''}
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 800; color: #fff; text-decoration: ${m.flg_concluida ? 'line-through' : 'none'};">${m.dsc_titulo}</div>
                    <div style="font-size: 9px; color: var(--text-muted);">${m.dsc_descricao}</div>
                </div>
                <div style="font-size: 9px; font-weight: 900; color: var(--accent-gold);">+${m.num_xp_recompensa} XP</div>
            </div>
        `).join('');
    },

    renderCalendar(month, year, presentDates) {
        const grid = document.getElementById('attendance-calendar-grid');
        if (!grid) return;

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const monthYearEl = document.getElementById('calendar-month-year');
        if (monthYearEl) monthYearEl.textContent = `${monthNames[month - 1]} ${year}`;

        // Inject Weekday Labels
        const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        grid.innerHTML = weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');

        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        // Empty cells for first day offset
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
            list.innerHTML = '<div style="color: #3a5a72; font-size: 0.75rem; text-align: center; padding: 20px;">Nenhum resultado recente.</div>';
            return;
        }

        list.innerHTML = ranking.slice(0, 5).map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `<span style="font-size: 10px; color: #4a6a88">${index + 1}º</span>`;
            return `
                <div class="ranking-item-compact">
                    <div class="ranking-item-player">
                        <div class="ranking-medal">${medal}</div>
                        <span>${player.dsc_nome_completo}</span>
                    </div>
                    <div class="ranking-item-score">${player.total_pontos || 0} pts</div>
                </div>
            `;
        }).join('');
    },

    renderEvolutionRanking(ranking) {
        const list = document.getElementById('evolution-list');
        if (!list) return;
        list.innerHTML = ranking.slice(0, 3).map((p, i) => {
            const val = parseFloat(p.num_evolucao || 0).toFixed(1);
            return `
                <div class="ranking-item-compact">
                    <div class="ranking-item-player">
                        <div class="ranking-medal" style="font-size: 10px; color: #4ade80">▲</div>
                        <span>${p.dsc_nome_completo}</span>
                    </div>
                    <div class="ranking-item-score" style="color: #4ade80">+${val}%</div>
                </div>
            `;
        }).join('') || '<div style="color: #3a5a72; font-size: 0.75rem; text-align: center;">Vazio</div>';
    },

    renderSkills(skills) {
        const list = document.getElementById('skills-list');
        if (!list) return;

        // Mock deltas for now while backend doesn't provide history
        const mockDeltas = { 'Controle': '+3', 'Bloqueio': '+5', 'Cozinhada': '+4', 'Topspin': '+8', 'BackHand': '-2' };

        list.innerHTML = skills.map(s => {
            const delta = mockDeltas[s.dsc_habilidade] || '—';
            const deltaClass = delta.startsWith('+') ? 'up' : (delta.startsWith('-') ? 'dn' : '');
            const deltaColor = delta.startsWith('+') ? '#3a8a5a' : (delta.startsWith('-') ? '#e05555' : '#4a6a88');
            
            return `
                <div class="skill-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <span class="skill-name" style="font-size: 10px; color: var(--text-muted); width: 80px; flex-shrink: 0;">${s.dsc_habilidade}</span>
                    <div class="skill-bar-bg" style="flex: 1; height: 4px; background: #1a3a52; border-radius: 3px; overflow: hidden;">
                        <div class="skill-bar-fill" style="width: ${s.num_nivel}%; height: 100%; border-radius: 3px; background: ${s.num_nivel > 70 ? 'var(--accent-cyan)' : 'var(--text-muted)'};"></div>
                    </div>
                    <span class="skill-val" style="font-size: 10px; color: var(--accent-cyan); width: 22px; text-align: right; flex-shrink: 0;">${s.num_nivel}</span>
                    <span class="skill-delta ${deltaClass}" style="font-size: 9px; width: 26px; text-align: right; flex-shrink: 0; color: ${deltaColor}">${delta}</span>
                </div>
            `;
        }).join('');
    },

    drawEvolutionChart(skillName, data) {
        const svg = document.getElementById('line-chart');
        if (!svg) return;

        // Implementation of the v6 SVG chart logic
        const W=760, H=280, pad={t:30, r:30, b:40, l:50};
        const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
        
        const all = [...data.eu, ...data.com];
        const mn = Math.max(0, Math.min(...all) - 10);
        const mx = Math.min(100, Math.max(...all) + 10);

        const x = i => pad.l + (i / (data.eu.length - 1)) * cW;
        const y = v => pad.t + cH - ((v - mn) / (mx - mn)) * cH;
        const pts = arr => arr.map((v, i) => `${x(i)},${y(v)}`).join(' ');

        const months = ['Set','Out','Nov','Dez','Jan','Fev','Mar'];
        
        const grid = [0, 0.25, 0.5, 0.75, 1].map(r => {
            const yy = pad.t + cH * (1 - r);
            const val = Math.round(mn + (mx - mn) * r);
            return `<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="#1a3a52" stroke-width="0.5" stroke-dasharray="${r === 0 ? 'none' : '3,3'}"/>
                    <text x="${pad.l - 6}" y="${yy + 4}" text-anchor="end" font-size="10" fill="#3a5a72">${val}</text>`;
        }).join('');

        const xlabels = months.map((m, i) => `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#3a5a72">${m}</text>`).join('');
        const area = `<polygon points="${pts(data.eu)} ${x(data.eu.length - 1)},${y(mn)} ${x(0)},${y(mn)}" fill="var(--accent-cyan)" fill-opacity="0.07"/>`;
        const comLine = `<polyline points="${pts(data.com)}" fill="none" stroke="var(--accent-purple)" stroke-width="1.5" stroke-dasharray="5,4" stroke-linejoin="round"/>`;
        const euLine = `<polyline points="${pts(data.eu)}" fill="none" stroke="var(--accent-cyan)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
        const dots = data.eu.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--accent-cyan)" stroke="#0d1e30" stroke-width="2"/>`).join('');
        
        const lastEu = data.eu[data.eu.length - 1], lastCom = data.com[data.com.length - 1];
        const diff = lastEu - lastCom;
        const dc = diff >= 0 ? '#3a8a5a' : '#e05555', ds = diff >= 0 ? '+' : '';
        const badge = `<rect x="${W - pad.r - 70}" y="${pad.t}" width="70" height="22" rx="5" fill="${diff >= 0 ? '#003a2a' : '#3a0a0a'}"/><text x="${W - pad.r - 35}" y="${pad.t + 14}" text-anchor="middle" font-size="10" fill="${dc}" font-weight="500">${ds}${diff.toFixed(1)} vs média</text>`;

        svg.innerHTML = grid + xlabels + area + comLine + euLine + dots + badge;
    },

    renderAttendanceRanking(ranking) {
        const list = document.getElementById('attendance-ranking-list');
        if (!list) return;
        list.innerHTML = ranking.slice(0, 3).map(p => `
            <div class="ranking-item-compact">
                <div class="ranking-item-player">
                    <div class="ranking-medal" style="font-size: 10px; color: var(--accent-gold)">🔥</div>
                    <span>${p.dsc_nome_completo}</span>
                </div>
                <div class="ranking-item-score" style="color: var(--accent-gold)">${p.total_treinos || 0}</div>
            </div>
        `).join('') || '<div style="color: #3a5a72; font-size: 0.75rem; text-align: center;">Vazio</div>';
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
    },

    updateTournamentBanner(stats, user = null) {
        const titleEl = document.getElementById('banner-title');
        const subEl = document.getElementById('banner-subtitle');
        const container = document.getElementById('tournament-banner-container');
        const iconContainer = document.getElementById('banner-icon-container');
        const actionsContainer = document.getElementById('banner-actions');
        
        if (!titleEl || !subEl) return;

        // SE NÃO COMPLETOU O DIAGNÓSTICO -> MOSTRAR BANNER DE ONBOARDING
        if (user && !user.flg_diagnostico_concluido) {
            titleEl.textContent = 'COMPLETE SEU DIAGNÓSTICO INICIAL';
            titleEl.style.color = '#fff';
            
            subEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: rgba(255, 165, 0, 0.2); color: #fbbf24; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">RECOMENDADO PARA COMEÇAR</span>
                </div>
                <div style="margin-top: 4px;">Responda 1 minuto de perguntas para mapear seu nível e liberar sua evolução personalizada.</div>
            `;
            
            if (iconContainer) {
                iconContainer.textContent = '🎯';
                iconContainer.classList.add('icon-onboarding');
            }

            if (actionsContainer) {
                actionsContainer.innerHTML = `
                    <button class="banner-btn btn-pulse" onclick="openDiagnosticModal()" style="background: #38bdf8; color: #0f172a; padding: 12px 32px; min-width: 160px; font-weight: 900; font-size: 14px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);">Começar agora</button>
                `;
            }

            if (container) {
                container.style.background = 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(13, 30, 48, 0.95) 100%)';
                container.style.borderColor = '#38bdf8';
                container.style.cursor = 'pointer';
                container.onclick = (e) => {
                    if (e.target.tagName !== 'BUTTON') window.openDiagnosticModal();
                };
            }
            return;
        }

        // RESET CASO VOLTE A SER TRUE
        if (container) {
            container.onclick = null;
            container.style.cursor = 'default';
        }
        if (actionsContainer) {
            actionsContainer.innerHTML = `
                <button class="banner-btn secondary" onclick="openTournamentModal()">Saber Mais</button>
                <button class="banner-btn" id="btn-inscricao-confirmada">Inscreva-se</button>
            `;
        }

        const pct = stats.pct_frequencia || 0;
        const targetTreinos = Math.ceil(0.6 * (stats.num_total_mes || 12));
        const missing = Math.max(0, targetTreinos - (stats.num_presencas || 0));

        if (pct >= 60) {
            titleEl.textContent = 'VAGA GARANTIDA! PARABÉNS!';
            titleEl.style.color = '#fff';
            subEl.innerHTML = `Sua frequência está em <strong>${pct}%</strong>. Você já habilitou sua inscrição oficial para o Torneio de Março!`;
            
            if (iconContainer) {
                iconContainer.textContent = '🏆';
                iconContainer.classList.add('icon-qualified');
            }

            if (container) {
                container.style.background = 'linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, rgba(13, 30, 48, 0.9) 100%)';
                container.style.borderColor = 'var(--accent-cyan)';
            }
        } else {
            titleEl.textContent = 'PRÓXIMO TORNEIO INTERNO: MARÇO 2026';
            titleEl.style.color = 'var(--accent-cyan)';
            subEl.innerHTML = `Mantenha sua frequência acima de 60%. Faltam apenas <strong>${missing} treinos</strong> para sua qualificação.`;
            
            if (iconContainer) {
                iconContainer.textContent = '📢';
                iconContainer.classList.remove('icon-qualified');
            }

            if (container) {
                container.style.background = 'var(--bg-card)';
                container.style.borderColor = 'var(--border-ui)';
            }
        }
    }
};
