/**
 * SPIN4ALL - HOME VIEW MODULE (Ultimate Restoration v12:10)
 * Base de Ontem (GitHub) + Melhorias de Hoje (Analista/Missões 12:10).
 */

class HomeView {
    constructor() {
        this.container = null;
    }

    setContainer(el) { this.container = el; }

    /**
     * ATO 1: MEU MOMENTO (Frequência)
     */
    updateFrequency(stats, isPastMonth, user) {
        const circle = document.getElementById('gauge-freq-circle');
        const freqVal = document.getElementById('gauge-freq-val');
        const freqStatus = document.getElementById('gauge-freq-status');
        
        if (!stats) return;
        if (freqVal) freqVal.textContent = Math.round(stats.percentage || 0);

        if (circle) {
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const pct = stats.percentage || 0;
            const offset = circumference - (pct / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;
        }

        if (freqStatus) {
            if (stats.percentage >= 60) {
                freqStatus.textContent = 'QUALIFICADO';
                freqStatus.style.background = 'var(--accent-lime)';
            } else {
                freqStatus.textContent = 'PENDENTE';
                freqStatus.style.background = '#f59e0b';
            }
        }
    }

    /**
     * ATO 2: ANALISTA PESSOAL (RESTAURADO 12:10)
     */
    renderAnalyst(data) {
        const headline = document.getElementById('analyst-headline');
        const summary = document.getElementById('analyst-summary');
        const focoEl = document.getElementById('analyst-foco');
        const acaoEl = document.getElementById('analyst-acao');

        if (!data) {
           if (headline) headline.textContent = "Analista Aguardando...";
           if (summary) summary.textContent = "O Spin Engine processará seus dados assim que houver atividade suficiente.";
           return;
        }

        if (headline) headline.textContent = data.headline || 'Conselho do Analista';
        if (summary) summary.textContent = data.explicacao || data.summary || '';
        if (focoEl) focoEl.textContent = data.foco || 'Sincronizando...';
        if (acaoEl) acaoEl.textContent = data.acao || 'Aguardando veredito.';

        if (data.missions) this.renderMissions(data.missions);
    }

    renderMissions(missions) {
        const list = document.getElementById('mural-missoes');
        if (!list) return;
        
        if (!missions || missions.length === 0) {
            list.innerHTML = '<div class="mission-item-mini">Nenhuma missão no momento.</div>';
            return;
        }

        list.innerHTML = missions.map(m => `
            <div class="mission-item-mini" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(56, 189, 248, 0.05); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.1); margin-bottom: 6px;">
                <i class="fas fa-bolt" style="color: var(--accent-cyan); font-size: 10px;"></i>
                <span style="font-size: 11px; color: #fff; font-weight: 500;">${m.dsc_titulo || 'Missão Técnica'}</span>
                <strong style="margin-left: auto; color: var(--accent-lime); font-size: 10px; font-weight: 900;">+${m.num_xp_recompensa || 10} XP</strong>
            </div>
        `).join('');
    }

    /**
     * ATO 3: POSIÇÃO & EVOLUÇÃO (GITHUB STABLE)
     */
    renderAttendanceRanking(ranking) {
        const list = document.getElementById('attendance-ranking-list');
        if (!list) return;

        if (!ranking || ranking.length === 0) {
            list.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">Aguardando dados...</div>';
            return;
        }

        list.innerHTML = ranking.slice(0, 3).map((p, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 10px; font-weight: 900; color: ${idx === 0 ? '#f59e0b' : 'var(--text-muted)'};">${idx + 1}º</span>
                    <span style="color:#fff; font-size: 12px; font-weight: 500;">${p.dsc_nome_completo.split(' ')[0]}</span>
                </div>
                <strong style="color:var(--accent-lime); font-size: 11px;">${p.total_treinos || 0} 🔥</strong>
            </div>
        `).join('');
    }

    renderEvolutionRanking(rank) {
        const list = document.getElementById('evolution-list');
        if (!list) return;
        if (!rank || rank.length === 0) {
            list.innerHTML = '<div style="font-size: 11px; color: var(--text-muted);">Evolução em processamento...</div>';
            return;
        }

        list.innerHTML = rank.slice(0, 3).map((p, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 10px; font-weight: 900; color: var(--accent-cyan); opacity: 0.6;">#${idx + 1}</span>
                    <span style="color:#fff; font-size: 12px; font-weight: 500;">${p.dsc_nome_completo.split(' ')[0]}</span>
                </div>
                <strong style="color:var(--accent-cyan); font-size: 11px;">+${p.delta_status || 0}%</strong>
            </div>
        `).join('');
    }

    /** 
     * COMPATIBILIDADE (SHELL & MODALS)
     */
    updateUserProfile(user) {
        if (window.renderShellUser) window.renderShellUser(user);
    }

    renderSkills(skills) { console.log('[VIEW] Skills updated:', skills); }
    renderTournamentsRanking() { }
    renderCommunityStats() { }
    drawEvolutionChart() { }
    renderCalendar() { }
}

export const homeView = new HomeView();
export default homeView;
