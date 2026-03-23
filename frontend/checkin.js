const API_URL = '/api';

// --- RELOGIO DE PAREDE ---
function updateMainClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;

    if (document.getElementById('mainClock')) document.getElementById('mainClock').innerText = timeStr;
    if (document.getElementById('bigClockCheckin')) document.getElementById('bigClockCheckin').innerText = timeStr;
}
setInterval(updateMainClock, 1000);
updateMainClock();

// --- TOGGLE VIEWS ---
function switchView(viewName) {
    document.getElementById('view-checkin').style.display = viewName === 'checkin' ? 'flex' : 'none';
    document.getElementById('view-workout').style.display = viewName === 'workout' ? 'flex' : 'none';

    document.getElementById('btn-view-checkin').classList.toggle('active', viewName === 'checkin');
    document.getElementById('btn-view-workout').classList.toggle('active', viewName === 'workout');
}

// --- ORQUESTRADOR DE TREINO ---
function generateId() { return Math.random().toString(36).substr(2, 9); }

function loadQueues() {
    const saved = localStorage.getItem('spin4all_queues');
    if (saved) return JSON.parse(saved);

    return {
        iniciante: [{ id: generateId(), desc: 'Aquecimento', totalSeconds: 600, remainingSeconds: 600, status: 'green', isRest: false, paused: false }],
        intermediario: [{ id: generateId(), desc: 'Aquecimento', totalSeconds: 600, remainingSeconds: 600, status: 'green', isRest: false, paused: false }],
        avancado: [{ id: generateId(), desc: 'Aquecimento', totalSeconds: 600, remainingSeconds: 600, status: 'green', isRest: false, paused: false }]
    };
}

let queues = loadQueues();
let setupTemp = { desc: '', minutes: 5, level: ['todos'], isRest: false, id: 0 };
let masterTimerInterval = null;
let highestRemainingTime = 0; // Para display no timer gigante
const audioBeep = document.getElementById('audioBeep');
let isWorkoutPaused = false;
let isWorkoutRunning = false;

function saveState() {
    localStorage.setItem('spin4all_queues', JSON.stringify(queues));
}

// --- CATALOGO DINAMICO ---
let catalogItems = JSON.parse(localStorage.getItem('spin4all_catalog')) || [
    { id: generateId(), name: 'Aquecimento', mins: 10, isRest: false, icon: 'fa-running' },
    { id: generateId(), name: 'Multibola Direto', mins: 5, isRest: false, icon: 'fa-bullseye' },
    { id: generateId(), name: 'Mesa a Mesa', mins: 7, isRest: false, icon: 'fa-exchange-alt' },
    { id: generateId(), name: 'Saque e 3ª Bola', mins: 5, isRest: false, icon: 'fa-table-tennis' },
    { id: generateId(), name: 'Partidas (Sets)', mins: 15, isRest: false, icon: 'fa-trophy' },
    { id: generateId(), name: 'Descanso', mins: 2, isRest: true, icon: 'fa-tint' }
];

function renderCatalog() {
    const list = document.getElementById('catalogList');
    if (!list) return;
    list.innerHTML = '';
    catalogItems.forEach(item => {
        const borderRest = item.isRest ? 'border-color: rgba(14, 165, 233, 0.5);' : '';
        const iconRest = item.isRest ? 'color: #38bdf8;' : '';
        const btnIcon = item.icon || 'fa-star';
        list.innerHTML += `
            <div style="display: flex; gap: 5px; width: 100%;">
                <button class="catalog-btn" style="flex: 1; text-align: left; padding-left: 15px; ${borderRest}" onclick="openSetupModal('${item.name}', 'Geral', ${item.mins}, ${item.isRest})">
                    <i class="fas ${btnIcon}" style="${iconRest}"></i> ${item.name}
                </button>
                <button class="action-btn delete" onclick="deleteCatalogItem('${item.id}')" title="Excluir do Catálogo" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; width: 45px; color: #fca5a5; cursor:pointer; flex-shrink: 0; transition: all 0.2s;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
}

function deleteCatalogItem(id) {
    const item = catalogItems.find(c => c.id === id);
    if (!item) return;
    
    // Trava de segurança reforçada
    const confirmacao = confirm(`⚠️ ATENÇÃO: Você deseja mesmo excluir "${item.name}" do catálogo permanentemente?\n\nEssa ação não pode ser desfeita e o exercício deixará de aparecer na sua lista de sugestões.`);
    
    if (confirmacao) {
        catalogItems = catalogItems.filter(c => c.id !== id);
        localStorage.setItem('spin4all_catalog', JSON.stringify(catalogItems));
        renderCatalog();
        console.log(`[CATALOG] Item ${id} removido.`);
    }
}

function openCustomModal() {
    openSetupModal('Personalizado', 'Geral', 5, false);
    document.getElementById('setupType').style.display = 'none';
    document.getElementById('customNameContainer').style.display = 'block';
    document.getElementById('customDescInput').value = '';
    document.getElementById('saveToCatalogCheck').checked = false;
    document.getElementById('customDescInput').focus();
}

function openSetupModal(desc, defaultLevel, defaultMins, isRest = false) {
    setupTemp = { id: generateId(), desc, minutes: defaultMins, level: ['todos'], isRest };
    document.getElementById('setupTitle').innerText = isRest ? 'Pausa / Descanso' : 'Adicionar ao Treino';
    document.getElementById('setupType').innerText = desc;

    document.getElementById('setupType').style.display = 'block';
    document.getElementById('customNameContainer').style.display = 'none';

    document.getElementById('setupMinutes').innerText = defaultMins;

    // reset level btns
    document.querySelectorAll('.level-tag').forEach(b => b.classList.remove('active'));
    document.querySelector('.level-tag[data-level="todos"]').classList.add('active');

    document.getElementById('setupOverlay').style.display = 'flex';
}

function adjustTime(diff) {
    let newTime = setupTemp.minutes + diff;
    if (newTime >= 1 && newTime <= 60) {
        setupTemp.minutes = newTime;
        document.getElementById('setupMinutes').innerText = newTime;
    }
}

document.querySelectorAll('.level-tag').forEach(btn => {
    btn.onclick = (e) => {
        const lvl = e.target.dataset.level;
        if (lvl === 'todos') {
            document.querySelectorAll('.level-tag').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            setupTemp.level = ['todos'];
        } else {
            document.querySelector('.level-tag[data-level="todos"]').classList.remove('active');
            e.target.classList.toggle('active');

            setupTemp.level = Array.from(document.querySelectorAll('.level-tag.active')).map(b => b.dataset.level);

            if (setupTemp.level.length === 0 || setupTemp.level.length === 3) {
                document.querySelectorAll('.level-tag').forEach(b => b.classList.remove('active'));
                document.querySelector('.level-tag[data-level="todos"]').classList.add('active');
                setupTemp.level = ['todos'];
            }
        }
    }
});

function addToQueue() {
    if (document.getElementById('customNameContainer').style.display === 'block') {
        const customVal = document.getElementById('customDescInput').value.trim();
        setupTemp.desc = customVal || 'Exercício Extra';

        if (document.getElementById('saveToCatalogCheck').checked) {
            saveToCatalogDB(setupTemp.desc, setupTemp.minutes);
        }
    }

    const levels = setupTemp.level.includes('todos') ? ['iniciante', 'intermediario', 'avancado'] : setupTemp.level;

    levels.forEach(lvl => {
        queues[lvl].push({
            id: generateId(),
            desc: setupTemp.desc,
            totalSeconds: setupTemp.minutes * 60,
            remainingSeconds: setupTemp.minutes * 60,
            status: 'green',
            isRest: setupTemp.isRest,
            paused: false
        });
    });

    closeModals();
    saveState();
    renderAllQueues();
}

function removePlaycard(level, id) {
    queues[level] = queues[level].filter(p => p.id !== id);
    saveState();
    renderQueue(level);
}

function editCardTime(level, id) {
    const card = queues[level].find(p => p.id === id);
    if (!card) return;
    
    const currentMins = Math.round((card.status === 'green' ? card.totalSeconds : card.remainingSeconds) / 60);
    const modeDesc = card.status === 'green' ? 'Tempo Total' : 'Tempo Restante';
    
    const newMins = prompt(`Editar ${modeDesc} de "${card.desc}":\nAtual: ${currentMins} min\n\nDigite o novo tempo em minutos:`, currentMins);
    
    if (newMins === null || newMins.trim() === '') return;
    const val = parseInt(newMins);
    
    if (!isNaN(val) && val >= 0) {
        if (card.status === 'green') {
            card.totalSeconds = val * 60;
            card.remainingSeconds = val * 60;
        } else {
            const diff = (val * 60) - card.remainingSeconds;
            card.remainingSeconds = val * 60;
            card.totalSeconds += diff;
            if (card.totalSeconds < 0) card.totalSeconds = 0;
        }
        saveState();
        renderQueue(level);
    }
}

function fastForwardCard(level, id) {
    const card = queues[level].find(p => p.id === id);
    if (card && card.status === 'yellow') {
        card.remainingSeconds = 1; 
    }
}

function saveToCatalogDB(nome, tempo) {
    catalogItems.push({ id: generateId(), name: nome, mins: tempo, isRest: false, icon: 'fa-star' });
    localStorage.setItem('spin4all_catalog', JSON.stringify(catalogItems));
    renderCatalog();
}

function clearQueue(level) {
    if (confirm(`Tem certeza que deseja zerar a fila de treino do nível ${level.toUpperCase()}?`)) {
        queues[level] = [];
        saveState();
        renderQueue(level);
    }
}

function toggleCardPause(level, id) {
    const card = queues[level].find(p => p.id === id);
    if (card) {
        card.paused = !card.paused;
        saveState();
        renderQueue(level);
    }
}

function renderAllQueues() {
    renderQueue('iniciante');
    renderQueue('intermediario');
    renderQueue('avancado');
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function renderQueue(level) {
    const col = document.getElementById(`list-${level}`);
    const totalEl = document.getElementById(`total-${level}`);
    if (!col || !totalEl) return;
    
    col.innerHTML = '';
    let totalSecs = 0;

    queues[level].forEach(item => {
        if (item.status !== 'red') {
            totalSecs += item.remainingSeconds;
        }

        let statusClass = item.status === 'yellow' && item.isRest ? 'status-rest' : `status-${item.status}`;
        let actionBtns = '';

        const pauseIcon = item.paused ? 'fa-play' : 'fa-pause';
        const pauseTitle = item.paused ? 'Retomar' : 'Pausar';
        const pauseClass = item.paused ? 'resume' : 'pause';

        if (item.status === 'green') {
            actionBtns = `
                <button class="action-btn" title="Editar Tempo" onclick="editCardTime('${level}', '${item.id}')" style="color:#38bdf8;"><i class="fas fa-clock"></i></button>
                <button class="action-btn ${pauseClass}" title="${pauseTitle}" onclick="toggleCardPause('${level}', '${item.id}')" style="color:#fbbf24;"><i class="fas ${pauseIcon}"></i></button>
                <button class="action-btn delete" title="Remover" onclick="removePlaycard('${level}', '${item.id}')"><i class="fas fa-times"></i></button>
            `;
        } else if (item.status === 'yellow') {
            actionBtns = `
                <button class="action-btn" title="Editar Tempo Remanescente" onclick="editCardTime('${level}', '${item.id}')" style="color:#38bdf8;"><i class="fas fa-clock"></i></button>
                <button class="action-btn ${pauseClass}" title="${pauseTitle}" onclick="toggleCardPause('${level}', '${item.id}')" style="color:#fbbf24;"><i class="fas ${pauseIcon}"></i></button>
                <button class="action-btn finish" title="Concluir Imediatamente" onclick="fastForwardCard('${level}', '${item.id}')"><i class="fas fa-forward"></i></button>
            `;
        }

        const pausedClass = item.paused ? 'is-paused' : '';

        col.innerHTML += `
            <div class="playcard ${statusClass} ${pausedClass}">
                <div class="desc">${item.desc}</div>
                <div class="time"><i class="fas fa-hourglass-half" style="font-size: 0.8rem; opacity: 0.7;"></i> ${formatTime(item.remainingSeconds)}</div>
                <div class="card-actions" style="position: static; margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end;">${actionBtns}</div>
            </div>
        `;
    });

    totalEl.innerHTML = `<i class="fas fa-stopwatch"></i> Tempo Restante: <strong>${formatTime(totalSecs)}</strong>`;
}

function toggleWorkoutState() {
    const btn = document.getElementById('btnStartAll');
    const timerEl = document.getElementById('masterTimer');
    const timerLabel = document.getElementById('masterTimerLabel');

    if (!isWorkoutRunning) {
        const hasTasks = ['iniciante', 'intermediario', 'avancado'].some(lvl =>
            queues[lvl].some(q => q.status === 'green' || q.status === 'yellow')
        );

        if (!hasTasks) {
            alert("Não há exercícios engatilhados na fila. Adicione algo do catálogo primeiro.");
            return;
        }

        isWorkoutRunning = true;
        isWorkoutPaused = false;
        localStorage.setItem('spin4all_running', 'true');
        startAllQueuesLogic();
        btn.innerHTML = '<i class="fas fa-pause"></i> Pausar Geral';
        btn.style.background = '#eab308';
        timerLabel.innerText = "TREINO EM ANDAMENTO";
        timerEl.classList.remove('paused');
    } else if (!isWorkoutPaused) {
        isWorkoutPaused = true;
        localStorage.setItem('spin4all_running', 'false');
        clearInterval(masterTimerInterval);
        btn.innerHTML = '<i class="fas fa-play"></i> Continuar Tudo';
        btn.style.background = '#38bdf8';
        timerLabel.innerText = "TREINO PAUSADO";
        timerEl.classList.add('paused');
    } else {
        isWorkoutPaused = false;
        localStorage.setItem('spin4all_running', 'true');
        masterTimerInterval = setInterval(tickAll, 1000);
        btn.innerHTML = '<i class="fas fa-pause"></i> Pausar Geral';
        btn.style.background = '#eab308';
        timerLabel.innerText = "TREINO EM ANDAMENTO";
        timerEl.classList.remove('paused');
    }
}

function startAllQueuesLogic() {
    ['iniciante', 'intermediario', 'avancado'].forEach(level => {
        if (!queues[level].find(q => q.status === 'yellow')) {
            const nextOne = queues[level].find(q => q.status === 'green' && !q.paused);
            if (nextOne) nextOne.status = 'yellow';
        }
    });
    renderAllQueues();
    if (masterTimerInterval) clearInterval(masterTimerInterval);
    masterTimerInterval = setInterval(tickAll, 1000);
}

function tickAll() {
    let activeTasks = false;
    let lowestSecs = null;
    let isGlobalRest = true;

    ['iniciante', 'intermediario', 'avancado'].forEach(level => {
        const active = queues[level].find(q => q.status === 'yellow');
        if (active) {
            activeTasks = true;
            if (!active.isRest) isGlobalRest = false;

            if (!isWorkoutPaused && !active.paused) {
                active.remainingSeconds--;
            }

            if (lowestSecs === null || active.remainingSeconds < lowestSecs) {
                lowestSecs = active.remainingSeconds;
            }

            if (active.remainingSeconds <= 0) {
                active.status = 'red';
                recordWorkoutHistory(active.desc, level, active.totalSeconds / 60);

                const nextOne = queues[level].find(q => q.status === 'green' && !q.paused);
                if (nextOne) nextOne.status = 'yellow';
            }
        } else {
            // Se nao tem um yellow, mas tem green nao pausado, ativa
            const nextOne = queues[level].find(q => q.status === 'green' && !q.paused);
            if (nextOne && isWorkoutRunning && !isWorkoutPaused) {
                nextOne.status = 'yellow';
                activeTasks = true;
                if (!nextOne.isRest) isGlobalRest = false;
            }
        }
    });

    if (!activeTasks) {
        clearInterval(masterTimerInterval);
        isWorkoutRunning = false;
        isWorkoutPaused = false;
        localStorage.removeItem('spin4all_running');
        localStorage.removeItem('spin4all_queues');
        const timerLabel = document.getElementById('masterTimerLabel');
        timerLabel.innerText = "TREINO FINALIZADO";
        document.getElementById('masterTimer').innerText = "00:00";
        document.getElementById('masterTimer').className = "massive-timer ending";
        document.getElementById('btnStartAll').innerHTML = '<i class="fas fa-check"></i> Treino Finalizado';
        document.getElementById('btnStartAll').style.background = '#4ade80';
        return;
    }

    saveState();
    renderAllQueues();
    updateMasterDisplay(lowestSecs === null ? 0 : lowestSecs, isGlobalRest);
}

function updateMasterDisplay(secs, isRest) {
    const masterTimer = document.getElementById('masterTimer');
    const timerLabel = document.getElementById('masterTimerLabel');

    masterTimer.innerText = formatTime(secs);

    if (secs <= 3 && secs > 0) {
        masterTimer.className = 'massive-timer ending';
        timerLabel.innerText = "ATENÇÃO!";
        audioBeep.pause();
        audioBeep.currentTime = 0;
        audioBeep.play().catch(e => console.log('Audio error:', e));
    } else if (secs === 0) {
        masterTimer.className = 'massive-timer ending';
        timerLabel.innerText = "FIM / TROCA";
    } else if (isRest) {
        masterTimer.className = 'massive-timer rest';
        timerLabel.innerText = "DESCANSO / PAUSA EM ANDAMENTO";
    } else {
        masterTimer.className = 'massive-timer';
        timerLabel.innerText = "PRÓXIMA TROCA EM:";
    }
}

async function recordWorkoutHistory(desc, level, mins) {
    console.log(`[DB Sim] Gravado Treino Executado: ${desc} | ${level} | ${mins}min`);
}

async function checkAdmin() {
    const token = localStorage.getItem('spin4all_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success || !data.user.flg_admin) {
            alert('Acesso restrito: Apenas administradores podem lançar o sistema de check-in.');
            window.location.href = 'dashboard.html';
            return;
        }

        init();
    } catch (err) {
        window.location.href = 'dashboard.html';
    }
}

async function init() {
    fetchMembers();
    renderCatalog();
    renderAllQueues();
}

let allMembers = [];
let selectedMember = null;

function getCheckinTime(userId) {
    const times = JSON.parse(localStorage.getItem('spin4all_checkin_times') || '{}');
    return times[userId];
}

function setCheckinTime(userId) {
    const times = JSON.parse(localStorage.getItem('spin4all_checkin_times') || '{}');
    const now = new Date();
    times[userId] = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    localStorage.setItem('spin4all_checkin_times', JSON.stringify(times));
}

function removeCheckinTime(userId) {
    const times = JSON.parse(localStorage.getItem('spin4all_checkin_times') || '{}');
    delete times[userId];
    localStorage.setItem('spin4all_checkin_times', JSON.stringify(times));
}

async function fetchMembers() {
    const token = localStorage.getItem('spin4all_token');
    try {
        const response = await fetch(`${API_URL}/checkin-list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allMembers = data.members;
            renderMembers(allMembers);
        }
    } catch (err) {
        console.error("Erro ao carregar membros:", err);
    }
}

function renderMembers(members) {
    const grid = document.getElementById('membersGrid');
    const presentList = document.getElementById('presentList');
    const countLabel = document.getElementById('presentCount');
    
    if (!grid || !presentList) return;
    grid.innerHTML = '';
    presentList.innerHTML = '';
    let pCount = 0;

    const present = members.filter(m => m.flg_presente);
    const absent = members.filter(m => !m.flg_presente);

    absent.sort((a, b) => {
        if ((b.qtd_presenca || 0) !== (a.qtd_presenca || 0)) {
            return (b.qtd_presenca || 0) - (a.qtd_presenca || 0);
        }
        return a.dsc_nome_completo.localeCompare(b.dsc_nome_completo);
    });

    present.sort((a, b) => a.dsc_nome_completo.localeCompare(b.dsc_nome_completo));

    const allToRender = [...present, ...absent];

    allToRender.forEach(m => {
        const initials = m.dsc_nome_completo.split(' ').filter(n => n.length > 2).map(n => n[0]).join('').substring(0, 2);
        const avatarHtml = m.dsc_foto_perfil 
            ? `<div class="avatar"><img src="${m.dsc_foto_perfil}?t=${new Date().getTime()}" alt="${m.dsc_nome_completo}"></div>`
            : `<div class="avatar">${initials || m.dsc_nome_completo[0]}</div>`;

        if (m.flg_presente) {
            pCount++;
            const card = document.createElement('div');
            card.className = 'playlist-card';
            const time = getCheckinTime(m.id_usuario) || "--:--"; 
            card.innerHTML = `
                ${avatarHtml}
                <div class="info">
                    <span class="name">${m.dsc_nome_completo}</span>
                    <span class="time-entry"><i class="far fa-clock" style="margin-right:4px;"></i> CHEGOU ÀS ${time}</span>
                </div>
            `;
            card.onclick = () => handleCardClick(m);
            presentList.appendChild(card);
        } else {
            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                ${avatarHtml}
                <div class="member-name">${m.dsc_nome_completo}</div>
            `;
            card.onclick = () => handleCardClick(m);
            grid.appendChild(card);
        }
    });

    if (countLabel) countLabel.innerText = pCount;
}

function handleCardClick(member) {
    selectedMember = member;
    const firstName = member.dsc_nome_completo.split(' ')[0];

    if (member.flg_presente) {
        document.getElementById('undoTitle').textContent = `Oi, ${firstName}!`;
        document.getElementById('undoOverlay').style.display = 'flex';
        document.getElementById('btnUndo').onclick = () => doUndo(member.id_usuario);
    } else {
        document.getElementById('confirmTitle').textContent = `Você é o ${firstName}?`;
        document.getElementById('confirmOverlay').style.display = 'flex';
        document.getElementById('btnConfirm').onclick = () => doCheckin(member.id_usuario, member.dsc_nome_completo);
    }
}

function closeModals() {
    document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none');
    selectedMember = null;
}

async function doCheckin(userId, fullName) {
    const token = localStorage.getItem('spin4all_token');
    closeModals();
    try {
        const response = await fetch(`${API_URL}/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_usuario: userId })
        });

        const data = await response.json();
        showFeedback(data.success, fullName, data.message);
        if (data.success) {
            setCheckinTime(userId);
            fetchMembers();
        }
    } catch (error) {
        showFeedback(false, "Erro", "Houve um problema com a conexão.");
    }
}

async function doUndo(userId) {
    const token = localStorage.getItem('spin4all_token');
    closeModals();
    try {
        const response = await fetch(`${API_URL}/checkin`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_usuario: userId })
        });

        const data = await response.json();
        showFeedback(data.success, "Corrigido", data.message);
        if (data.success) {
            removeCheckinTime(userId);
            fetchMembers();
        }
    } catch (error) {
        showFeedback(false, "Erro", "Houve um problema com a conexão.");
    }
}

function showFeedback(success, fullName, msg) {
    const overlay = document.getElementById('successOverlay');
    const fbName = document.getElementById('feedback-name');
    const fbMsg = document.getElementById('feedback-msg');
    const icon = overlay.querySelector('i');

    fbName.textContent = success ? `Legal, ${fullName.split(' ')[0]}!` : "Opa!";
    fbMsg.textContent = msg;
    icon.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    icon.style.color = success ? '#4ade80' : '#f87171';

    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.display = 'none';
        const searchInput = document.getElementById('memberSearch');
        if (searchInput) searchInput.value = '';
    }, 2500);
}

// Filtro de Busca
const memberSearch = document.getElementById('memberSearch');
if (memberSearch) {
    memberSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allMembers.filter(m =>
            m.dsc_nome_completo.toLowerCase().includes(term)
        );
        renderMembers(filtered);
    });
}

// Inicializar com proteção
checkAdmin();
