export const profileView = {
    radarChart: null,

    renderProfile(userData) {
        // Mapeamento dos campos do banco para a tela
        console.log('[ProfileView] Renderizando com dados:', userData);
        
        const objectiveEl = document.getElementById('user-objective');
        if (objectiveEl) objectiveEl.textContent = userData.dsc_objetivo || userData.dsc_metas || 'Defina seu objetivo nas configurações';
        
        const weightEl = document.getElementById('user-weight');
        const heightEl = document.getElementById('user-height');
        if (weightEl) weightEl.textContent = userData.num_peso_kg || '--';
        if (heightEl) heightEl.textContent = userData.num_altura_cm || '--';
        
        this.updateIMC(userData.num_peso_kg, userData.num_altura_cm);
        
        const sideEl = document.getElementById('user-side');
        const gripEl = document.getElementById('user-grip');
        if (sideEl) sideEl.textContent = userData.dsc_lateralidade || '--';
        if (gripEl) gripEl.textContent = userData.dsc_empunhadura || '--';

        const quoteEl = document.getElementById('motivational-quote-profile');
        if (quoteEl) quoteEl.textContent = userData.dsc_mensagem_mentor || '"O único lugar onde o sucesso vem antes do trabalho é no dicionário."';

        // Mapeamento de Habilidades Técnicas (Campos do banco: num_skill_...)
        const skillKeys = [
            { key: 'forehand', db: 'num_skill_forehand' },
            { key: 'backhand', db: 'num_skill_backhand' },
            { key: 'cozinhada', db: 'num_skill_cozinhada' },
            { key: 'topspin', db: 'num_skill_topspin' },
            { key: 'saque', db: 'num_skill_saque' },
            { key: 'rally', db: 'num_skill_rally' },
            { key: 'ataque', db: 'num_skill_ataque' },
            { key: 'defesa', db: 'num_skill_defesa' },
            { key: 'bloqueio', db: 'num_skill_bloqueio' },
            { key: 'controle', db: 'num_skill_controle' },
            { key: 'movimentacao', db: 'num_skill_movimentacao' }
        ];
        
        const skillValues = {};

        skillKeys.forEach(item => {
            const slider = document.getElementById(`skill-${item.key}`);
            const label = document.getElementById(`label-${item.key}`);
            const val = userData[item.db] || 50;
            
            if (slider) slider.value = val;
            if (label) label.textContent = val;
            
            skillValues[item.key] = val;
        });

        this.renderRadarChart(skillValues);
    },

    updateIMC(weight, height) {
        if (!weight || !height) return;
        const hMeter = height / 100;
        const imc = (weight / (hMeter * hMeter)).toFixed(1);
        const imcDisplay = document.getElementById('user-imc');
        if (imcDisplay) {
            imcDisplay.textContent = imc;
            if (imc < 18.5 || imc > 25) {
                imcDisplay.style.color = '#fbbf24'; 
            } else {
                imcDisplay.style.color = '#4ade80';
            }
        }
    },

    renderRadarChart(skills) {
        const canvas = document.getElementById('skillsRadarChart');
        if (!canvas) return;

        const labels = ['Forehand', 'Backhand', 'Cozinhada', 'Topspin', 'Saque', 'Rally', 'Ataque', 'Defesa', 'Bloqueio', 'Controle', 'Movim.'];
        const dataValues = [
            skills.forehand || 50,
            skills.backhand || 50,
            skills.cozinhada || 50,
            skills.topspin || 50,
            skills.saque || 50,
            skills.rally || 50,
            skills.ataque || 50,
            skills.defesa || 50,
            skills.bloqueio || 50,
            skills.controle || 50,
            skills.movimentacao || 50
        ];

        const data = {
            labels: labels,
            datasets: [{
                label: 'Nível Técnico',
                data: dataValues,
                fill: true,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                borderColor: '#38bdf8',
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#38bdf8'
            }]
        };

        if (this.radarChart) {
            this.radarChart.destroy();
        }

        const ChartLib = window.Chart;
        if (!ChartLib) return;

        this.radarChart = new ChartLib(canvas, {
            type: 'radar',
            data: data,
            options: {
                elements: { line: { borderWidth: 3 } },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#94a3b8', font: { size: 10 } },
                        ticks: { display: false, stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
};
