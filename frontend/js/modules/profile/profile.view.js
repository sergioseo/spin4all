export const profileView = {
    radarChart: null,

    renderProfile(userData, history = [], effortStats = []) {
        console.log('[ProfileView] Renderização Técnica v12:10 (Absolute Restoration)');
        
        // 1. UPDATE HEADER STATUS (ADMIN/AVANÇADO)
        const adminBadge = document.getElementById('admin-badge');
        if (adminBadge) adminBadge.style.display = userData.isAdmin ? 'block' : 'none';

        const welcomeEl = document.getElementById('user-welcome');
        if (welcomeEl) welcomeEl.textContent = `Olá, ${userData.dsc_nome ? userData.dsc_nome.split(' ')[0] : 'Sérgio'}!`;

        const xpVal = document.getElementById('user-xp-val');
        const xpBar = document.getElementById('user-xp-progress-bar');
        if (xpVal) xpVal.textContent = userData.num_xp || 0;
        if (xpBar) xpBar.style.width = `${Math.min(100, (userData.num_xp / 1000) * 100)}%`;

        // 2. INDICATORS (GRID SUPERIOR)
        const mappings = [
            { id: 'user-style', val: userData.dsc_perfil_estilo || 'Equilibrado' },
            { id: 'user-height-full', val: `${userData.num_altura_cm || '--'}cm` },
            { id: 'user-weight-full', val: `${userData.num_peso_kg || '--'}kg` },
            { id: 'user-side', val: userData.dsc_lateralidade || 'Destro' },
            { id: 'user-grip', val: userData.dsc_empunhadura || 'Clássica' }
        ];
        mappings.forEach(m => {
            const el = document.getElementById(m.id);
            if (el) el.textContent = m.val;
        });

        this.updateIMC(userData.num_peso_kg, userData.num_altura_cm);

        // 3. SKILLS SIDEBAR (RESTAURAÇÃO VISUAL 10/10)
        const skillsList = document.getElementById('skills-list-compact');
        if (!skillsList) return;

        const skillKeys = [
            { key: 'forehand', label: 'Forehand', db: 'num_skill_forehand' },
            { key: 'backhand', label: 'Backhand', db: 'num_skill_backhand' },
            { key: 'cozinhada', label: 'Cozinhada', db: 'num_skill_cozinhada' },
            { key: 'topspin', label: 'Topspin', db: 'num_skill_topspin' },
            { key: 'saque', label: 'Saque', db: 'num_skill_saque' },
            { key: 'rally', label: 'Rally', db: 'num_skill_rally' },
            { key: 'ataque', label: 'Ataque', db: 'num_skill_ataque' },
            { key: 'defesa', label: 'Defesa', db: 'num_skill_defesa' },
            { key: 'bloqueio', label: 'Bloqueio', db: 'num_skill_bloqueio' },
            { key: 'controle', label: 'Controle', db: 'num_skill_controle' },
            { key: 'movimentacao', label: 'Movimentação', db: 'num_skill_movimentacao' }
        ];

        skillsList.innerHTML = '';
        const currentSkills = {};

        skillKeys.forEach(item => {
            const val = userData[item.db] || 0;
            currentSkills[item.key] = val;

            const itemHtml = `
                <div class="skill-item-compact" style="margin-bottom: 18px;">
                    <div class="skill-info-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="skill-name" style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">${item.label}</span>
                        <span id="label-${item.key}" class="skill-numeric-value" style="font-size: 11px; font-weight: 900; color: #38bdf8; font-family: 'Inter', sans-serif;">${val}</span>
                    </div>
                    <div class="slider-container" style="position: relative; height: 5px; background: rgba(255,255,255,0.03); border-radius: 10px; overflow: visible;">
                        <input type="range" class="compact-slider" id="skill-${item.key}" min="0" max="100" value="${val}" 
                            style="position: absolute; top: -5px; left: 0; width: 100%; height: 16px; appearance: none; background: transparent; z-index: 5; cursor: pointer; margin: 0;">
                        <div id="fill-${item.key}" style="position: absolute; top: 0; left: 0; width: ${val}%; height: 100%; background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%); box-shadow: 0 0 12px rgba(56, 189, 248, 0.4); border-radius: 10px; pointer-events: none;"></div>
                    </div>
                </div>
            `;
            skillsList.insertAdjacentHTML('beforeend', itemHtml);
        });

        // 4. MAP DATA FOR RADAR (TRIPLE LAYER)
        let initialSkills = null;
        if (history && history.length > 0) {
            const first = history[0];
            initialSkills = {
                forehand: first.num_skill_forehand || 0,
                backhand: first.num_skill_backhand || 0,
                cozinhada: first.num_skill_cozinhada || 0,
                topspin: first.num_skill_topspin || 0,
                saque: first.num_skill_saque || 0,
                rally: first.num_skill_consistency || 0,
                ataque: first.num_skill_ataque || 0,
                defesa: first.num_skill_defesa || 0,
                bloqueio: first.num_skill_bloqueio || 0,
                controle: first.num_skill_controle || 0,
                movimentacao: first.num_skill_movimentacao || 0
            };
        }

        const effortMap = {
            forehand: 0, backhand: 0, cozinhada: 0, topspin: 0,
            saque: 0, rally: 0, ataque: 0, defesa: 0,
            bloqueio: 0, controle: 0, movimentacao: 0
        };

        effortStats.forEach(s => {
            const tag = s.tag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (effortMap[tag] !== undefined) {
                effortMap[tag] = Math.min(100, (s.total_xp / 10)); 
            }
        });

        this.renderRadarChart(currentSkills, initialSkills, effortMap);
    },

    updateSkillLabel(key, val) {
        const label = document.getElementById(`label-${key}`);
        const fill = document.getElementById(`fill-${key}`);
        
        if (fill) fill.style.width = `${val}%`;
        if (label) label.textContent = val;
    },

    updateIMC(weight, height) {
        if (!weight || !height) return;
        const hMeter = height / 100;
        const imc = (weight / (hMeter * hMeter)).toFixed(1);
        const imcDisplay = document.getElementById('user-imc');
        if (imcDisplay) {
            imcDisplay.textContent = imc;
            imcDisplay.style.color = (imc < 18.5 || imc > 25) ? '#fbbf24' : '#38bdf8';
        }
    },

    renderRadarChart(current, initial = null, effort = null) {
        const canvas = document.getElementById('skillsRadarChart');
        if (!canvas) return;

        const labels = ['Forehand', 'Backhand', 'Cozinhada', 'Topspin', 'Saque', 'Rally', 'Ataque', 'Defesa', 'Bloqueio', 'Controle', 'Movim.'];
        const datasets = [];

        // 1. Diagnóstico Inicial (Branco)
        if (initial) {
            datasets.push({
                label: 'Diagnóstico Inicial',
                data: [
                    initial.forehand, initial.backhand, initial.cozinhada, initial.topspin,
                    initial.saque, initial.rally, initial.ataque, initial.defesa,
                    initial.bloqueio, initial.controle, initial.movimentacao
                ],
                fill: true,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'transparent',
                borderWidth: 0,
                pointRadius: 0
            });
        }

        // 2. Esforço Aplicado (Âmbar/Laranja) 
        if (effort) {
            datasets.push({
                label: 'Investimento de Suor (Missões)',
                data: [
                    effort.forehand, effort.backhand, effort.cozinhada, effort.topspin,
                    effort.saque, effort.rally, effort.ataque, effort.defesa,
                    effort.bloqueio, effort.controle, effort.movimentacao
                ],
                fill: true,
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                borderColor: '#f59e0b',
                borderWidth: 1.5,
                pointRadius: 0,
                borderDash: [5, 5]
            });
        }

        // 3. Nível Atual (Azul)
        datasets.push({
            label: 'Nível Atual',
            data: [
                current.forehand, current.backhand, current.cozinhada, current.topspin,
                current.saque, current.rally, current.ataque, current.defesa,
                current.bloqueio, current.controle, current.movimentacao
            ],
            fill: true,
            backgroundColor: 'rgba(56, 189, 248, 0.22)',
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointBackgroundColor: '#38bdf8',
            pointRadius: 3,
            pointBorderColor: '#0f172a',
            pointBorderWidth: 1
        });

        if (this.radarChart) this.radarChart.destroy();

        const ChartLib = window.Chart;
        if (!ChartLib) return;

        this.radarChart = new ChartLib(canvas, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { display: true, color: 'rgba(255, 255, 255, 0.05)' },
                        grid: { display: true, color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: { 
                            color: '#94a3b8', 
                            font: { size: 10, weight: '700' },
                            padding: 10
                        },
                        ticks: { display: false, stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#64748b', font: { size: 10, weight: '700' }, boxWidth: 8, padding: 20 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#38bdf8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(56, 189, 248, 0.2)',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });
    }
};
