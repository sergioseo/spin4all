export const profileView = {
    radarChart: null,

    renderProfile(userData, history = []) {
        console.log('[ProfileView] Renderizando perfil estrutural...', userData);
        
        // Dados Superiores (Row 2 Indicators)
        const styleEl = document.getElementById('user-style');
        if (styleEl) styleEl.textContent = userData.dsc_perfil_estilo || 'Equilibrado';

        const weightEl = document.getElementById('user-weight-full');
        const heightEl = document.getElementById('user-height-full');
        if (weightEl) weightEl.textContent = `${userData.num_peso_kg || '--'}kg`;
        if (heightEl) heightEl.textContent = `${userData.num_altura_cm || '--'}cm`;
        
        this.updateIMC(userData.num_peso_kg, userData.num_altura_cm);
        
        const sideEl = document.getElementById('user-side');
        const gripEl = document.getElementById('user-grip');
        if (sideEl) sideEl.textContent = userData.dsc_lateralidade || 'Destro';
        if (gripEl) gripEl.textContent = userData.dsc_empunhadura || 'Clássica';

        // Renderização de Skills Compacta (Sidebar)
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
            const val = userData[item.db] || 50;
            currentSkills[item.key] = val;

            const itemHtml = `
                <div class="skill-item-compact">
                    <div class="skill-info-row">
                        <span class="skill-name">${item.label}</span>
                        <span id="label-${item.key}" class="skill-numeric-value">${val}</span>
                    </div>
                    <input type="range" class="compact-slider" id="skill-${item.key}" min="0" max="100" value="${val}" style="background: linear-gradient(to right, #38bdf8 ${val}%, rgba(255,255,255,0.08) ${val}%)">
                </div>
            `;
            skillsList.insertAdjacentHTML('beforeend', itemHtml);
            
            // Listeners gerenciados pelo Controller
        });

        // Comparação
        let initialSkills = null;
        if (history && history.length > 0) {
            const first = history[0];
            initialSkills = {
                forehand: first.num_skill_forehand,
                backhand: first.num_skill_backhand,
                cozinhada: first.num_skill_cozinhada || 50,
                topspin: first.num_skill_topspin || 50,
                saque: first.num_skill_saque,
                rally: first.num_skill_consistency || 50,
                ataque: first.num_skill_ataque,
                defesa: first.num_skill_defesa,
                bloqueio: first.num_skill_bloqueio || 50,
                controle: first.num_skill_controle,
                movimentacao: first.num_skill_movimentacao
            };
        }

        this.renderRadarChart(currentSkills, initialSkills);
    },

    updateSkillLabel(key, val) {
        const label = document.getElementById(`label-${key}`);
        const slider = document.getElementById(`skill-${key}`);
        
        if (slider) {
            slider.style.background = `linear-gradient(to right, #38bdf8 ${val}%, rgba(255,255,255,0.08) ${val}%)`;
        }

        if (label) {
            label.textContent = val;
            label.style.color = '#38bdf8';
        }
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

    renderRadarChart(current, initial = null) {
        const canvas = document.getElementById('skillsRadarChart');
        if (!canvas) return;

        const labels = ['Forehand', 'Backhand', 'Cozinhada', 'Topspin', 'Saque', 'Rally', 'Ataque', 'Defesa', 'Bloqueio', 'Controle', 'Movim.'];
        const datasets = [];

        if (initial) {
            datasets.push({
                label: 'Diagnóstico Inicial',
                data: [
                    initial.forehand, initial.backhand, initial.cozinhada, initial.topspin,
                    initial.saque, initial.rally, initial.ataque, initial.defesa,
                    initial.bloqueio, initial.controle, initial.movimentacao
                ],
                fill: true,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'transparent',
                borderWidth: 0,
                pointRadius: 0
            });
        }

        datasets.push({
            label: 'Nível Atual',
            data: [
                current.forehand, current.backhand, current.cozinhada, current.topspin,
                current.saque, current.rally, current.ataque, current.defesa,
                current.bloqueio, current.controle, current.movimentacao
            ],
            fill: true,
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
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
                layout: {
                    padding: { bottom: 15 }
                },
                scales: {
                    r: {
                        angleLines: { display: true, color: 'rgba(255, 255, 255, 0.05)' },
                        grid: { display: true, color: 'rgba(255, 255, 255, 0.08)' },
                        pointLabels: { 
                            color: '#64748b', 
                            font: { size: 11, weight: '600' },
                            padding: 6
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
                        labels: { color: '#475569', font: { size: 11 }, boxWidth: 10, padding: 25 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#38bdf8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false
                    }
                }
            }
        });
    }
};
