const API_URL = (window.location.hostname.includes('spin4all.com.br'))
    ? 'https://spin4all-motor.h5rvsp.easypanel.host/api'
    : window.location.origin + '/api';

console.log(`[DEBUG Dashboard] API_URL: ${API_URL}`);
console.log(`[DEBUG Dashboard] Hostname: ${window.location.hostname}`);

let userData = null;
let skillsChart = null;
let currentViewMonth = new Date().getMonth() + 1;
let currentViewYear = new Date().getFullYear();

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    document.getElementById(`tab-${tab}`).style.display = 'block';
    document.getElementById(`nav-${tab}`).classList.add('active');
}

// --- Modais de Torneio ---
function openTournamentModal() {
    const modal = document.getElementById('tournamentModal');
    if (modal) modal.style.display = 'flex';
}

function closeTournamentModal() {
    const modal = document.getElementById('tournamentModal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('tournamentModal');
    if (event.target == modal) closeTournamentModal();
}

function handleUnderstood() {
    closeTournamentModal();
    console.log('Usuário leu as informações do torneio.');
}

async function loadUserData() {
    const token = localStorage.getItem('spin4all_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falha ao carregar dados');

        const data = await response.json();
        userData = data.user;

        // Preencher Dashboard
        document.getElementById('user-welcome').textContent = `Olá, ${userData.dsc_nome_completo.split(' ')[0]}!`;
        document.getElementById('user-email').textContent = userData.dsc_email;
        document.getElementById('user-level-badge').textContent = userData.dsc_level || 'MEMBRO';
        document.getElementById('user-height').textContent = userData.num_altura_cm || '--';
        document.getElementById('user-weight').textContent = userData.num_peso_kg || '--';
        document.getElementById('user-side').textContent = userData.dsc_lateralidade || '--';
        document.getElementById('user-grip').textContent = userData.dsc_empunhadura || '--';
        document.getElementById('user-objective').textContent = userData.dsc_metas || 'Sem metas definidas';

        // Popular Sliders Técnicos
        const skills = ['forehand', 'backhand', 'cozinhada', 'topspin', 'saque', 'rally', 'ataque', 'defesa', 'bloqueio', 'controle', 'movimentacao'];
        skills.forEach(s => {
            const val = userData[`num_skill_${s}`] || 50;
            const slider = document.getElementById(`skill-${s}`);
            if (slider) {
                slider.value = val;
                const label = document.getElementById(`label-${s}`);
                if (label) label.textContent = val;
            }
        });

        // Mostrar menus restritos se o usuário for administrador
        if (userData.flg_admin) {
            const adminNavItem = document.getElementById('admin-nav-item');
            if (adminNavItem) adminNavItem.style.display = 'block';
        }

        if (userData.num_peso_kg && userData.num_altura_cm) {
            const imc = (userData.num_peso_kg / Math.pow(userData.num_altura_cm / 100, 2)).toFixed(2);
            document.getElementById('user-imc').textContent = imc;
        }

        // Carregar Frequência e checar elegibilidade para torneio
        await loadAttendanceData();
        checkTournamentEligibility();

        // Preencher Formulário de Edição
        document.getElementById('edit-name').value = userData.dsc_nome_completo;
        document.getElementById('edit-weight').value = userData.num_peso_kg || '';
        document.getElementById('edit-height').value = userData.num_altura_cm || '';
        document.getElementById('edit-lateralidade').value = userData.dsc_lateralidade || 'Destro';
        document.getElementById('edit-grip').value = userData.dsc_empunhadura || 'Clássica';
        document.getElementById('edit-level').value = userData.dsc_nivel_tecnico || 'Iniciante';
        document.getElementById('edit-goals').value = userData.dsc_metas || '';
        document.getElementById('edit-mentor-message').value = userData.dsc_mensagem_mentor || '';
        
        if (userData.dt_nascimento) {
            document.getElementById('edit-birth').value = userData.dt_nascimento.split('T')[0];
        }

        // Mostrar foto se existir
        if (userData.dsc_foto_perfil) {
            const img = document.getElementById('user-photo-img');
            img.src = userData.dsc_foto_perfil + '?t=' + new Date().getTime();
            img.style.display = 'block';
            const icon = document.querySelector('#user-profile-img-container i');
            if (icon) icon.style.display = 'none';
        }

        initRadarChart();
        loadRanking();
        setMotivationalQuote();

    } catch (err) {
        console.error(err);
        logout();
    }
}

function checkTournamentEligibility() {
    const freqEl = document.getElementById('frequency-pct');
    if (!freqEl) return;
    
    const freq = parseInt(freqEl.innerText) || 0;
    const btnSaibaMais = document.getElementById('btn-saiba-mais');
    const btnInscricao = document.getElementById('btn-inscricao-real');

    if (freq >= 60) {
        if (btnSaibaMais) btnSaibaMais.style.display = 'none';
        if (btnInscricao) {
            btnInscricao.style.display = 'block';
            btnInscricao.onclick = () => {
                alert('🎉 Inscrição Realizada! Você está na lista oficial para o próximo Sextão.');
                btnInscricao.innerText = 'Inscrito / Apto ✓';
                btnInscricao.disabled = true;
                btnInscricao.style.background = '#22c55e';
            };
        }
    }
}

async function loadAttendanceData(month = currentViewMonth, year = currentViewYear) {
    const token = localStorage.getItem('spin4all_token');
    try {
        const response = await fetch(`${API_URL}/user/attendance-calendar?month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            renderCalendar(month, year, data.dates);

            // Cálculo de frequência do mês atual (para o círulo)
            const now = new Date();
            if (month === now.getMonth() + 1 && year === now.getFullYear()) {
                updateFrequencyCircle(data.dates.length);
            }
        }
    } catch (err) {
        console.error('Erro ao carregar frequência:', err);
    }
}

function updateFrequencyCircle(daysPresent) {
    const target = 12; // Estimativa simples de 12 treinos/mês
    const pct = Math.min(Math.round((daysPresent / target) * 100), 100);

    const circle = document.getElementById('frequency-progress');
    const radius = 56;
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
}

function renderCalendar(month, year, presentDates) {
    const grid = document.getElementById('attendance-calendar-grid');
    if (!grid) return;

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthYearEl = document.getElementById('calendar-month-year');
    if (monthYearEl) monthYearEl.textContent = `${monthNames[month - 1]} ${year}`;

    const labels = grid.querySelectorAll('.day-label');
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
        dayEl.style.display = 'flex';
        dayEl.style.alignItems = 'center';
        dayEl.style.justifyContent = 'center';
        dayEl.style.fontSize = '0.6rem';
        dayEl.style.fontWeight = '700';
        dayEl.style.color = isPresent ? '#0f172a' : '#64748b';
        dayEl.textContent = day;
        grid.appendChild(dayEl);
    }
}

function changeMonth(delta) {
    currentViewMonth += delta;
    if (currentViewMonth > 12) {
        currentViewMonth = 1;
        currentViewYear++;
    } else if (currentViewMonth < 1) {
        currentViewMonth = 12;
        currentViewYear--;
    }
    loadAttendanceData(currentViewMonth, currentViewYear);
}

async function uploadPhoto(input) {
    if (!input.files || !input.files[0]) return;
    const token = localStorage.getItem('spin4all_token');
    const formData = new FormData();
    formData.append('photo', input.files[0]);

    try {
        const response = await fetch(`${API_URL}/user/upload-photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            const img = document.getElementById('user-photo-img');
            img.src = result.url + '?t=' + new Date().getTime();
            img.style.display = 'block';
            const icon = document.querySelector('#user-profile-img-container i');
            if (icon) icon.style.display = 'none';
            alert('Foto atualizada!');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar foto.');
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('spin4all_token');
    const data = {
        name: document.getElementById('edit-name').value,
        weight: parseFloat(document.getElementById('edit-weight').value),
        height: parseInt(document.getElementById('edit-height').value),
        lateralidade: document.getElementById('edit-lateralidade').value,
        grip: document.getElementById('edit-grip').value,
        level: document.getElementById('edit-level').value,
        goals: document.getElementById('edit-goals').value,
        mentor_message: document.getElementById('edit-mentor-message').value,
        birth: document.getElementById('edit-birth').value
    };

    try {
        const response = await fetch(`${API_URL}/update-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('Perfil atualizado com sucesso!');
            loadUserData();
            switchTab('home');
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
    }
}

function initRadarChart() {
    const canvas = document.getElementById('skillsRadarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const skills = ['forehand', 'backhand', 'cozinhada', 'topspin', 'saque', 'rally', 'ataque', 'defesa', 'bloqueio', 'controle', 'movimentacao'];
    const labels = ['Forehand', 'Backhand', 'Cozinha', 'Topspin', 'Saque', 'Rally', 'Ataque', 'Defesa', 'Bloqueio', 'Controle', 'Movimentação'];
    const dataValues = skills.map(s => {
        const slider = document.getElementById(`skill-${s}`);
        return slider ? parseInt(slider.value) : 50;
    });

    if (skillsChart) skillsChart.destroy();

    skillsChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nível Técnico',
                data: dataValues,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                borderColor: '#38bdf8',
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#38bdf8',
                borderWidth: 3,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#94a3b8', font: { size: 10, weight: '600' } },
                    ticks: { display: false, count: 5 },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

function updateSkillUI() {
    const skills = ['forehand', 'backhand', 'cozinhada', 'topspin', 'saque', 'rally', 'ataque', 'defesa', 'bloqueio', 'controle', 'movimentacao'];
    const dataValues = [];

    skills.forEach(s => {
        const val = document.getElementById(`skill-${s}`).value;
        const label = document.getElementById(`label-${s}`);
        if (label) label.textContent = val;
        dataValues.push(parseInt(val));
    });

    if (skillsChart) {
        skillsChart.data.datasets[0].data = dataValues;
        skillsChart.update();
    }
}

async function saveTechnicalSkills() {
    const token = localStorage.getItem('spin4all_token');
    const skills = ['forehand', 'backhand', 'cozinhada', 'topspin', 'saque', 'rally', 'ataque', 'defesa', 'bloqueio', 'controle', 'movimentacao'];
    const skillData = {};

    skills.forEach(s => {
        skillData[s] = parseInt(document.getElementById(`skill-${s}`).value);
    });

    try {
        const response = await fetch(`${API_URL}/user/save-skills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(skillData)
        });
        const result = await response.json();
        if (result.success) {
            alert('Status técnico atualizado com sucesso! 🏆');
        } else {
            alert('Erro ao salvar: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Falha ao conectar ao servidor.');
    }
}

async function loadRanking() {
    try {
        const response = await fetch(`${API_URL}/user/hall-fama`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('spin4all_token')}` }
        });
        const data = await response.json();

        const list = document.getElementById('ranking-list');
        if (data.success && data.ranking.length > 0) {
            list.innerHTML = data.ranking.map((player, index) => {
                const medal = index === 0 ? '<i class="fas fa-medal" style="color: #fbbf24;"></i>' :
                    index === 1 ? '<i class="fas fa-medal" style="color: #94a3b8;"></i>' :
                        index === 2 ? '<i class="fas fa-medal" style="color: #b45309;"></i>' :
                            `<span style="width: 20px; text-align: center; font-weight: 800; color: #64748b;">${index + 1}º</span>`;

                const photo = player.dsc_foto_perfil ?
                    `<img src="${player.dsc_foto_perfil}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">` :
                    `<div style="width: 35px; height: 35px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #94a3b8;"><i class="fas fa-user"></i></div>`;

                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateX(5px)'" onmouseout="this.style.transform='translateX(0)'">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 25px; display: flex; justify-content: center; font-size: 1.1rem;">${medal}</div>
                            ${photo}
                            <span style="font-size: 0.9rem; font-weight: 600; color: #f8fafc;">${player.dsc_nome_completo}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.9rem; color: #38bdf8; font-weight: 800;">${player.total_pontos}</div>
                            <div style="font-size: 0.6rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Pontos</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<div style="color: #64748b; font-size: 0.8rem; text-align: center; padding: 20px;">Nenhum resultado de torneio nos últimos 12 meses.</div>';
        }
    } catch (err) {
        console.error('Erro ao carregar ranking:', err);
    }
}

async function loadEvolutionRanking() {
    try {
        const response = await fetch(`${API_URL}/user/evolution-ranking`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('spin4all_token')}` }
        });
        const data = await response.json();
        const list = document.getElementById('evolution-list');
        if (data.success && data.ranking.length > 0) {
            list.innerHTML = data.ranking.map((p, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(56, 189, 248, 0.05); padding: 10px 15px; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-weight: 800; color: #38bdf8;">#${idx + 1}</div>
                        <span style="font-size: 0.85rem; font-weight: 600; color: #f8fafc;">${p.dsc_nome_completo}</span>
                    </div>
                    <div style="color: #4ade80; font-weight: 800; font-size: 0.9rem;">+${(parseFloat(p.evolucao_pontos) || 0).toFixed(1)}</div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div style="color: #64748b; font-size: 0.75rem; text-align: center;">Sem evolução registrada este mês.</div>';
        }
    } catch (err) { console.error(err); }
}

async function loadCommunityStats() {
    try {
        const response = await fetch(`${API_URL}/community/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('spin4all_token')}` }
        });
        const res = await response.json();
        if (res.success) {
            const data = res.data;
            document.getElementById('community-active-count').textContent = data.active_today;
            document.getElementById('community-main-focus').textContent = data.main_focus || 'Treino Geral';

            renderCommunityLevelChart(data.levels);
            renderWeeklyEngagementChart(data.weekly_engagement);

            const activityList = document.getElementById('community-activity-list');
            activityList.innerHTML = data.recent_activity.map(act => `
                <div style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.03); padding: 12px 15px; border-radius: 12px; border-left: 4px solid #38bdf8; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <div style="font-size: 1.4rem; color: #fbbf24; width: 30px; display: flex; justify-content: center;">
                        <i class="${act.dsc_icone || 'fas fa-medal'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 800; color: #fff;">${act.dsc_nome_completo}</div>
                        <div style="font-size: 0.7rem; color: #94a3b8; font-style: italic;">Conquistou: ${act.dsc_nome}</div>
                    </div>
                </div>
            `).join('') || '<div style="color: #64748b; font-size: 0.7rem; text-align: center; padding: 20px;">Nenhuma atividade recente.</div>';
        }
    } catch (err) { console.error('Erro ao carregar stats:', err); }
}

function renderWeeklyEngagementChart(rawData) {
    const canvas = document.getElementById('weeklyEngagementChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.weeklyChart) window.weeklyChart.destroy();
    window.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rawData.map(d => d.label),
            datasets: [{
                label: 'Check-ins',
                data: rawData.map(d => d.value),
                backgroundColor: 'rgba(56, 189, 248, 0.4)',
                borderColor: '#38bdf8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#64748b', font: { size: 10 }, boxWidth: 10 }
                }
            },
            scales: {
                y: { beginAtZero: true, display: false },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } }
            }
        }
    });
}

function renderCommunityLevelChart(levels) {
    const canvasEl = document.getElementById('communityLevelChart');
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (window.levelChart) window.levelChart.destroy();

    const labels = levels.map(l => l.dsc_nivel_tecnico);
    const values = levels.map(l => parseInt(l.num_membros || l.qtd || 0));
    const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];

    window.levelChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: '#64748b', font: { size: 10 }, padding: 10, boxWidth: 10 }
                }
            }
        }
    });

    const legendContainer = document.getElementById('community-level-legend');
    if (legendContainer) {
        legendContainer.innerHTML = labels.map((label, i) => {
            const val = values[i] || 0;
            return `
                <div style="display: flex; align-items: center; gap: 5px; font-size: 0.65rem; color: #94a3b8;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[i % colors.length]}"></div>
                    ${label || 'Indefinido'} (${val})
                </div>
            `;
        }).join('');
    }
}

async function updatePassword(e) {
    e.preventDefault();
    const token = localStorage.getItem('spin4all_token');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    if (!currentPassword || !newPassword) {
        alert('Preencha as senhas atual e nova.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/update-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.json();
        if (result.success) {
            alert('Senha alterada com sucesso! 🛡️');
            document.getElementById('password-form').reset();
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
    }
}

function setMotivationalQuote() {
    const quotes = [
        "O tênis de mesa não é sobre quem bate mais forte, mas sobre quem erra menos.",
        "Sua maior vitória é superar a preguiça de treinar hoje.",
        "O saque é a única jogada que depende 100% de você. Domine-o.",
        "A consistência no rally ganha jogos; a criatividade ganha torneios.",
        "Cada ponto perdido é uma lição. Cada ponto ganho é um passo para o topo.",
        "Não pare quando estiver cansado, pare quando o treino acabar.",
        "A mentalidade fria é o motor do campeão de Spin4All.",
        "O talento vence jogos, mas o trabalho em equipe vence campeonatos."
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    const qHome = document.getElementById('motivational-quote');
    if (qHome) qHome.textContent = `"${quote}"`;
    const qProfile = document.getElementById('motivational-quote-profile');
    if (qProfile) qProfile.textContent = `"${quote}"`;
}

function logout() {
    localStorage.removeItem('spin4all_token');
    window.location.href = 'login.html';
}

async function loadAttendanceRanking() {
    try {
        const response = await fetch(`${API_URL}/community/attendance-ranking`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('spin4all_token')}` }
        });
        const data = await response.json();
        const list = document.getElementById('attendance-ranking-list');
        if (data.success && data.ranking.length > 0) {
            list.innerHTML = data.ranking.map((p, idx) => {
                const photo = p.dsc_foto_perfil ?
                    `<img src="${p.dsc_foto_perfil}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` :
                    `<div style="width: 30px; height: 30px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;"><i class="fas fa-user"></i></div>`;
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-weight: 800; color: #38bdf8; min-width: 20px;">${idx + 1}º</span>
                            ${photo}
                            <span style="font-size: 0.8rem; font-weight: 600; color: #f8fafc;">${p.dsc_nome_completo.split(' ')[0]}</span>
                        </div>
                        <div style="font-size: 0.8rem; color: #38bdf8; font-weight: 800;">${p.total_treinos} <small style="font-size: 0.6rem; color: #94a3b8;">TREINOS</small></div>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<div style="color: #64748b; font-size: 0.75rem; text-align: center;">Carregando frequência...</div>';
        }
    } catch (err) { console.error(err); }
}

const sponsorData = [
    { nome: "PATROCINADOR 1", url: "www.patrocinador1.com.br", bg: "#0d2137" },
    { nome: "PATROCINADOR 2", url: "www.patrocinador2.com.br", bg: "#12203a" },
    { nome: "PATROCINADOR 3", url: "www.patrocinador3.com.br", bg: "#0a1a2e" }
];

let currentSponsorIndex = 0;

function initSponsorCarousel() {
    const container = document.getElementById('sponsor-carousel');
    if (!container) return;

    sponsorData.forEach((sponsor, idx) => {
        const slide = document.createElement('div');
        slide.className = `sponsor-slide ${idx === 0 ? 'active' : ''}`;
        slide.style.background = sponsor.bg;
        slide.innerHTML = `
            <div class="sponsor-name">${sponsor.nome}</div>
            <div class="sponsor-url">${sponsor.url}</div>
        `;
        container.appendChild(slide);
    });

    setInterval(rotateSponsors, 5000);
}

function rotateSponsors() {
    const slides = document.querySelectorAll('.sponsor-slide');
    if (slides.length === 0) return;

    slides[currentSponsorIndex].classList.remove('active');
    currentSponsorIndex = (currentSponsorIndex + 1) % slides.length;
    slides[currentSponsorIndex].classList.add('active');
}

// Inicialização Centralizada
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadCommunityStats();
    loadEvolutionRanking();
    loadAttendanceRanking();
    initSponsorCarousel();
});
