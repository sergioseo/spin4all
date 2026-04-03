import { apiFetch } from './services/api.js';
import { userService } from './services/user.service.js';

// --- INITIALIZATION ---
async function initGovernance() {
    console.log('[BOLT:UI] Iniciando hub de governança...');
    const token = localStorage.getItem('spin4all_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await userService.getUser();
        
        if (!response.success || !response.user.flg_admin) {
            console.warn('[BOLT:UI] Acesso negado: Usuário não é administrador.');
            window.location.href = 'dashboard.html';
            return;
        }

        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
        
        setupEvents();
        loadHistory();
    } catch (err) {
        console.error('[BOLT:UI] Erro crítico na inicialização:', err);
        window.location.href = 'dashboard.html';
    }
}

// --- EVENTS ---
function setupEvents() {
    const dispatchBtn = document.getElementById('dispatch-btn');
    const intentInput = document.getElementById('mission-intent');

    dispatchBtn.addEventListener('click', async () => {
        const intent = intentInput.value.trim();
        if (!intent) return alert('Por favor, descreva a intenção da missão.');

        try {
            dispatchBtn.disabled = true;
            dispatchBtn.innerHTML = '<i class="fas fa-satellite fa-spin"></i> DESPACHANDO...';

            const data = await apiFetch('/governance/dispatch', {
                method: 'POST',
                body: JSON.stringify({ intent })
            });

            if (data.success) {
                renderMissionCard(data.jobId, data.missionId, intent);
                saveToHistory(intent);
                intentInput.value = '';
            } else {
                alert('Erro ao despachar: ' + data.error);
            }
        } catch (err) {
            alert('Falha na conexão com o servidor.');
        } finally {
            dispatchBtn.disabled = false;
            dispatchBtn.innerHTML = '<i class="fas fa-paper-plane"></i> DESPACHAR MISSÃO';
        }
    });

    // Botão de Limpeza Global
    const cleanBtn = document.createElement('button');
    cleanBtn.id = 'clean-patches-btn';
    cleanBtn.className = 'glass-btn';
    cleanBtn.style.cssText = `
        margin-top: 10px; width: 100%; padding: 10px; border-radius: 8px; 
        background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2);
        color: #f43f5e; font-size: 0.75rem; font-weight: 700; cursor: pointer;
        transition: all 0.2s ease;
    `;
    cleanBtn.innerHTML = '<i class="fas fa-eraser"></i> LIMPAR AMBIENTE LOCAL (REMOVER RASCUNHOS)';
    document.querySelector('.dispatch-card').appendChild(cleanBtn);

    cleanBtn.addEventListener('click', cleanLocalPatches);
}

async function cleanLocalPatches() {
    const btn = document.getElementById('clean-patches-btn');
    
    if (!confirm('Deseja remover todas as pré-visualizações do BOLT e voltar ao estado original do site?')) return;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LIMPANDO...';
        
        const data = await apiFetch('/governance/clean-local', {
            method: 'DELETE'
        });

        if (data.success) {
            alert('✨ Ambiente limpo! O site original foi restaurado.');
            location.reload();
        } else {
            alert('Erro ao limpar: ' + data.error);
        }
    } catch (err) {
        alert('Falha na conexão.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-eraser"></i> LIMPAR AMBIENTE LOCAL';
    }
}

// --- RENDER & POLL ---
function renderMissionCard(jobId, missionId, intent) {
    const queue = document.getElementById('missions-queue');
    
    // Remover o placeholder de "nenhuma missão" se existir
    if (queue.innerText.includes('Nenhuma missão')) queue.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'glass-card mission-card';
    card.id = `mission-${jobId}`;
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
            <div>
                <span style="display: block; font-size: 0.7rem; color: #64748b; font-family: monospace;">ID: ${missionId}</span>
                <strong style="color: #38bdf8; display: block; margin-top: 5px;">${intent.substring(0, 40)}...</strong>
            </div>
            <span id="status-${jobId}" class="status-badge status-active">ATIVO</span>
        </div>
        
        <div id="logs-${jobId}" class="log-console">
            [BOLT] Missão recebida e enfileirada no Redis.<br>
            [BOLT] Aguardando Worker disponível...
        </div>

        <div id="actions-${jobId}" style="display: none;">
            <button class="approve-btn" onclick="approveJob('${missionId}', '${jobId}')">
                <i class="fas fa-check"></i> APROVAR PROMOÇÃO LIVE
            </button>
        </div>
    `;

    queue.prepend(card);
    pollJobStatus(jobId, missionId);
    pollJobLogs(jobId, missionId); // Iniciar polling de logs ao vivo
}

async function pollJobLogs(jobId, missionId) {
    const logsEl = document.getElementById(`logs-${jobId}`);
    let lastLogIndex = 0;

    const interval = setInterval(async () => {
        try {
            const data = await apiFetch(`/governance/logs/${jobId}`);

            if (data.success && data.logs.length > lastLogIndex) {
                const newLogs = data.logs.slice(lastLogIndex);
                newLogs.forEach(entry => {
                    const logLine = document.createElement('div');
                    logLine.className = 'vivid-log-line';
                    logLine.innerHTML = entry;
                    
                    // Se for um highlite de deliberação, dar destaque
                    if (entry.includes('⚖️')) logLine.style.color = '#38bdf8';
                    if (entry.includes('⚙️')) logLine.style.color = '#facc15';
                    if (entry.includes('✅')) logLine.style.color = '#4ade80';

                    logsEl.appendChild(logLine);
                });
                lastLogIndex = data.logs.length;
                logsEl.scrollTop = logsEl.scrollHeight;
            }

            // Parar polling se o card de status não estiver mais ativo/waiting
            const statusEl = document.getElementById(`status-${jobId}`);
            if (statusEl && (statusEl.innerText === 'COMPLETED' || statusEl.innerText === 'FAILED')) {
                clearInterval(interval);
            }
        } catch (err) {
            console.error('Log polling error:', err);
        }
    }, 2000);
}

async function pollJobStatus(jobId, missionId) {
    const statusEl = document.getElementById(`status-${jobId}`);
    const logsEl = document.getElementById(`logs-${jobId}`);
    const actionsEl = document.getElementById(`actions-${jobId}`);

    const interval = setInterval(async () => {
        try {
            const data = await apiFetch(`/governance/status/${jobId}`);

            if (!data.success) return clearInterval(interval);

            const state = data.state;
            statusEl.innerText = state.toUpperCase();
            
            if (state === 'completed') {
                statusEl.className = 'status-badge status-completed';
                clearInterval(interval);
                
                // Verificar se o motor terminou com sucesso ou erro
                const result = data.result;
                if (result && result.success) {
                    logsEl.innerHTML += `<br><span style="color: #4ade80;">[BOLT] Etapa concluída com sucesso.</span>`;
                    
                    // ESTADO: Aguardando Validação Dev (Portão 1)
                    if (result.status === 'awaiting_dev_validation') {
                        actionsEl.style.display = 'flex';
                        actionsEl.style.justifyContent = 'center';
                        actionsEl.style.gap = '20px';
                        actionsEl.style.marginTop = '25px';
                        actionsEl.dataset.manifest = JSON.stringify(result.manifest);
                        
                        actionsEl.innerHTML = `
                            <button id="apply-btn-${jobId}" class="preview-btn" onclick="applyToLocal('${missionId}', '${jobId}')" 
                                style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; min-width: 220px;">
                                <i class="fas fa-magic"></i> VISUALIZAR NO SITE (APLICAR)
                            </button>
                            <button class="prepare-btn" onclick="prepareJob('${missionId}', '${jobId}')" 
                                style="background: #3b82f6; border: none; color: #fff; padding: 12px 35px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); min-width: 220px;">
                                <i class="fas fa-arrow-right"></i> MOVER PARA FILA DE PRODUÇÃO
                            </button>
                        `;
                    }

                    // ESTADO: Em Fila de Produção (Portão 2)
                    if (result.status === 'staging_prepared' || result.status === 'awaiting_promotion') {
                        renderAuditReport(jobId, result.audit_report);
                        
                        if (result.vivid_history) {
                            renderVividHistory(jobId, result.vivid_history);
                        }

                        actionsEl.style.display = 'flex';
                        actionsEl.style.justifyContent = 'center';
                        actionsEl.style.gap = '20px';
                        actionsEl.style.marginTop = '25px';
                        actionsEl.dataset.releasePath = result.releasePath;
                        
                        actionsEl.innerHTML = `
                            <button id="apply-btn-${jobId}" class="preview-btn" onclick="applyToLocal('${missionId}', '${jobId}')" 
                                style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; min-width: 220px;">
                                <i class="fas fa-magic"></i> REVER NO SITE (APLICAR)
                            </button>
                            <button class="approve-btn" onclick="approveJob('${missionId}', '${jobId}')" 
                                style="background: #22c55e; border: none; color: #fff; padding: 12px 35px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); min-width: 250px;">
                                <i class="fas fa-rocket"></i> APROVAR PROMOÇÃO LIVE
                            </button>
                        `;

                        logsEl.innerHTML += `<br><div style="color: #94a3b8; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: 10px;">
                            <i class="fas fa-info-circle"></i> Missão pronta no Staging. Verifique o impacto acima antes da promoção final.
                        </div>`;
                    }
                } else {
                    const errMsg = result ? (result.error || 'Resultado sem sucesso ou erro indefinido.') : 'Sem resposta do motor.';
                    logsEl.innerHTML += `<br><span style="color: #f43f5e;">[BOLT] Erro no pipeline: ${errMsg}</span>`;
                }

            } else if (state === 'failed') {
                statusEl.className = 'status-badge status-failed';
                logsEl.innerHTML += `<br><span style="color: #f43f5e;">[FATAL] Job falhou: ${data.failedReason}</span>`;
                clearInterval(interval);
            } else {
                // Em andamento...
                logsEl.innerHTML += `<br>[${new Date().toLocaleTimeString()}] Status: ${state}...`;
                logsEl.scrollTop = logsEl.scrollHeight;
            }

        } catch (err) {
            console.error('Polling error:', err);
        }
    }, 3000);
}

async function applyToLocal(missionId, jobId) {
    const btn = document.getElementById(`apply-btn-${jobId}`);
    const logsEl = document.getElementById(`logs-${jobId}`);

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> APLICANDO AO SITE...';
        
        const data = await apiFetch('/governance/apply-local', {
            method: 'POST',
            body: JSON.stringify({ executionId: missionId })
        });

        if (data.success) {
            btn.style.background = 'rgba(74, 222, 128, 0.1)';
            btn.style.borderColor = 'rgba(74, 222, 128, 0.4)';
            btn.style.color = '#4ade80';
            btn.innerHTML = '<i class="fas fa-check"></i> APLICADO! ATUALIZE O SITE';
            
            const logLine = document.createElement('div');
            logLine.className = 'vivid-log-line';
            logLine.style.color = '#4ade80';
            logLine.innerHTML = `[TESTE-HUMANO] 🛡️ <b>CAMADA DE SEGURANÇA APLICADA (OVERLAY)</b> <br> 🏠 <b>Instrução:</b> Recarregue o site para validar a mudança. Não houve alteração nos seus arquivos fontes originais!`;
            logsEl.appendChild(logLine);
            logsEl.scrollTop = logsEl.scrollHeight;
        } else {
            alert('Erro ao aplicar: ' + result.error);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> TENTAR NOVAMENTE';
        }
    } catch (err) {
        console.error('Apply error:', err);
        alert('Falha na conexão.');
        btn.disabled = false;
    }
}

async function prepareJob(missionId, jobId) {
    const actionsEl = document.getElementById(`actions-${jobId}`);
    const manifest = JSON.parse(actionsEl.dataset.manifest || '{}');
    const token = localStorage.getItem('spin4all_token');

    if (!confirm('Deseja mover esta missão para a FILA DE PRODUÇÃO? O motor preparará o pacote de Staging.')) return;

    try {
        actionsEl.innerHTML = `<span style="color: #3b82f6; font-size: 0.8rem; font-weight: 600;"><i class="fas fa-spinner fa-spin"></i> PREPARANDO STAGING...</span>`;
        
        const result = await apiFetch('/governance/prepare', {
            method: 'POST',
            body: JSON.stringify({ executionId: missionId, manifest })
        });
        if (result.success) {
            // A atualização virá pelo polling do status (que mudará para staging_prepared)
            console.log('Staging preparado com sucesso.');
        } else {
            alert(`Erro na preparação: ${result.error}`);
            location.reload();
        }
    } catch (err) {
        console.error('Prepare error:', err);
        alert('Falha ao comunicar com o servidor.');
    }
}

async function approveJob(missionId, jobId) {
    const actionsEl = document.getElementById(`actions-${jobId}`);
    const releasePath = actionsEl.dataset.releasePath;
    const token = localStorage.getItem('spin4all_token');

    if (!confirm('⚠️ ATENÇÃO: Você está prestes a aplicar mudanças em LIVE (Produção). Confirmar Swap Atômico?')) return;

    try {
        actionsEl.innerHTML = `<span style="color: #22c55e; font-size: 0.8rem; font-weight: 600;"><i class="fas fa-spinner fa-spin"></i> PROMOVENDO PARA LIVE...</span>`;

        const result = await apiFetch('/governance/approve', {
            method: 'POST',
            body: JSON.stringify({ 
                executionId: missionId, 
                releasePath: releasePath 
            })
        });
        if (result.success) {
            alert('🚀 SUCESSO! A missão foi promovida para Produção com Swap Atômico.');
            location.reload();
        } else {
            alert(`Erro na promoção: ${result.error}`);
            location.reload();
        }
    } catch (err) {
        console.error('Approve error:', err);
        alert('Falha ao comunicar com o servidor.');
    }
}

// --- HISTORY LOGIC ---
const HISTORY_KEY = 'bolt_mission_history_v1';

function saveToHistory(intent) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    // Remover duplicata se houver e adicionar no topo
    history = history.filter(h => h !== intent);
    history.unshift(intent);
    
    // Manter apenas as últimas 3
    history = history.slice(0, 3);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function loadHistory() {
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('mission-history-list');
    const container = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = '';
    
    history.forEach(intent => {
        const tag = document.createElement('div');
        tag.className = 'history-tag';
        tag.style.cssText = `
            background: rgba(56, 189, 248, 0.1);
            border: 1px solid rgba(56, 189, 248, 0.2);
            color: #38bdf8;
            padding: 8px 15px;
            border-radius: 8px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        tag.title = intent;
        tag.innerHTML = `<i class="fas fa-quote-left" style="font-size:0.6rem; opacity:0.5;"></i> ${intent}`;
        
        tag.addEventListener('mouseenter', () => tag.style.background = 'rgba(56, 189, 248, 0.2)');
        tag.addEventListener('mouseleave', () => tag.style.background = 'rgba(56, 189, 248, 0.1)');
        
        tag.addEventListener('click', () => {
            const input = document.getElementById('mission-intent');
            input.value = intent;
            input.focus();
            input.style.border = '1px solid #38bdf8';
            setTimeout(() => input.style.border = '1px solid rgba(56, 189, 248, 0.3)', 300);
        });

        list.appendChild(tag);
    });
}

// --- AUDIT BRIEFING ---
function renderAuditReport(jobId, report) {
    if (!report) return;
    
    const logsEl = document.getElementById(`logs-${jobId}`);
    
    const briefingHtml = `
        <div style="margin-top: 15px; background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                <span style="font-weight: 800; font-size: 0.75rem; color: #38bdf8;"><i class="fas fa-clipboard-list"></i> MISSION BRIEFING</span>
                <span style="font-size: 0.7rem; color: #94a3b8;">Confiança: ${report.confidence} | Risco: ${report.risk_level}</span>
            </div>
            
            <p style="font-size: 0.85rem; color: #f8fafc; margin-bottom: 12px; line-height: 1.4;"><strong>Objetivo:</strong> ${report.mission_summary}</p>
            
            <div style="margin-bottom: 10px;">
                <span style="display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Arquivos Impactados:</span>
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px;">
                    ${report.impact_files.map(f => `<span style="background: rgba(15, 23, 42, 0.5); padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; border: 1px solid rgba(255,255,255,0.05);">${f}</span>`).join('')}
                </div>
            </div>

            <div>
                <span style="display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Passos de Execução:</span>
                <ul style="margin: 5px 0 0 15px; padding: 0; font-size: 0.75rem; color: #cbd5e1;">
                    ${report.technical_steps.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    logsEl.innerHTML += briefingHtml;
    logsEl.scrollTop = logsEl.scrollHeight;
}

function renderVividHistory(jobId, history) {
    const logsEl = document.getElementById(`logs-${jobId}`);
    
    const historyHtml = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
            <span style="display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Retrospectiva Detalhada (Vivid History):</span>
            <div style="background: rgba(15, 23, 42, 0.3); border-radius: 4px; padding: 10px; font-family: monospace; font-size: 0.7rem; max-height: 150px; overflow-y: auto; color: #94a3b8;">
                ${history.map(h => `<div style="margin-bottom: 2px;">${h}</div>`).join('')}
            </div>
        </div>
    `;
    
    logsEl.innerHTML += historyHtml;
    logsEl.scrollTop = logsEl.scrollHeight;
}

function openSandboxPreview(missionId) {
    const modal = document.getElementById('preview-modal');
    const iframe = document.getElementById('preview-frame');
    const token = localStorage.getItem('spin4all_token');
    
    // Passar o token via query para o middleware de autenticacao
    iframe.src = `/api/governance/preview/${missionId}?path=index.html&token=${token}`;
    modal.style.display = 'flex';
}

function closePreview() {
    const modal = document.getElementById('preview-modal');
    modal.style.display = 'none';
    document.getElementById('preview-frame').src = 'about:blank';
}

// Iniciar
initGovernance();

// Expor funções para o escopo global (necessário para onclick no HTML dinâmico)
window.applyToLocal = applyToLocal;
window.prepareJob = prepareJob;
window.approveJob = approveJob;
window.openSandboxPreview = openSandboxPreview;
window.closePreview = closePreview;
window.cleanLocalPatches = cleanLocalPatches;
