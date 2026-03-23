import { CONFIG } from '../../config.js';

class MonitoringModule {
    constructor() {
        this.processList = document.getElementById('process-list');
        this.stats = {
            total: document.getElementById('stat-total'),
            success: document.getElementById('stat-success'),
            fail: document.getElementById('stat-fail'),
            working: document.getElementById('stat-working')
        };
        this.lastUpdate = document.getElementById('last-update');
        this.lastActionTime = 0; // Track when a manual run was triggered

        this.init();
    }

    init() {
        console.log('[MONITORING] Initializing dashboard...');
        this.loadData();
        setInterval(() => this.loadData(), 5000); // Polling every 5s
        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnRunEtl = document.getElementById('btn-run-etl');
        const btnRunAnalysis = document.getElementById('btn-run-analysis');
        const btnClearLogs = document.getElementById('btn-clear-logs'); // Renamed from btnClear to btnClearLogs for clarity

        if (btnRunEtl) {
            btnRunEtl.addEventListener('click', () => {
                this.lastActionTime = Date.now() - 5000; // Small buffer for server time
                this.triggerJob('ETL_MATCHES', btnRunEtl, '/api/admin/monitoring/trigger-etl');
            });
        }
        
        if (btnRunAnalysis) {
            btnRunAnalysis.addEventListener('click', () => {
                this.lastActionTime = Date.now() - 5000;
                this.triggerJob('AI_ANALYSIS', btnRunAnalysis, '/api/admin/monitoring/trigger-analysis');
            });
        }
        if (btnClearLogs) { // Use btnClearLogs
            btnClearLogs.addEventListener('click', () => this.clearLogs(btnClearLogs));
        }
    }

    async clearLogs(btn) {
        if (!confirm('Deseja realmente limpar todo o histórico de registros?')) return;
        
        try {
            const token = localStorage.getItem('spin4all_token');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = '⌛ Limpando...';

            const res = await fetch('/api/admin/monitoring/logs', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.refresh(); // Changed from loadData() to refresh() to match existing methods
            } else {
                const data = await res.json();
                alert('Erro ao limpar logs: ' + (data.error || res.statusText));
            }
        } catch (error) {
            console.error('Error clearing logs:', error);
            alert('Erro ao limpar logs: ' + error.message);
        } finally {
            // Restore button text after success/fail
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = 'Limpar Logs'; // Assuming original text was 'Limpar Logs'
            }, 2000);
        }
    }

    async triggerJob(jobName, btn, endpoint) {
        try {
            const token = localStorage.getItem('spin4all_token');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = '⌛ Enfileirando...';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (data.success) {
                this.refresh();
            } else {
                alert('Erro ao disparar: ' + data.error);
            }
            
            // Restore button text after success/fail
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }, 2000);

        } catch (err) {
            console.error(`[MONITORING] Trigger ${jobName} failed:`, err);
            btn.disabled = false;
            btn.textContent = '❌ Falhou';
        }
    }

    async refresh() {
        try {
            const token = localStorage.getItem('spin4all_token');
            const url = `/api/admin/monitoring/status`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Security: If not admin (403), boot out
            if (res.status === 403 || res.status === 401) {
                window.location.href = '../dashboard.html';
                return;
            }

            const data = await res.json();

            if (data.success) {
                this.updateStats(data.today_stats);
                this.renderProcesses(data.processes);
                this.lastUpdate.textContent = `Última atualização: ${new Date().toLocaleTimeString()}`;
            }
        } catch (err) {
            console.error('[MONITORING] Refresh failed:', err);
        }
    }

    updateStats(stats = {}) {
        try {
            if (this.stats.total) this.stats.total.textContent = stats.total || 0;
            if (this.stats.success) this.stats.success.textContent = stats.success || 0;
            if (this.stats.fail) this.stats.fail.textContent = stats.fail || 0;
            if (this.stats.working) this.stats.working.textContent = stats.working || 0;
        } catch (err) {
            console.error('[MONITORING] Error updating stats card:', err);
        }
    }

    renderProcesses(processes = []) {
        try {
            if (!this.processList) return;

            if (!processes || processes.length === 0) {
                this.processList.innerHTML = '<div class="process-item" style="opacity: 0.5">Nenhum processo registrado hoje.</div>';
                return;
            }

            this.processList.innerHTML = processes.map(p => {
                try {
                    const hasError = p.status === 'FAIL';
                    const metadataStr = p.metadata ? (typeof p.metadata === 'object' ? JSON.stringify(p.metadata) : p.metadata) : '';
                    
                    // Logic for "New Batch" highlighting
                    const processTime = new Date(p.dt_updated || p.dt_started).getTime();
                    const isNewBatch = this.lastActionTime > 0 && processTime >= this.lastActionTime;
                    const timeColor = isNewBatch ? '#ffcc00' : 'rgba(255, 255, 255, 0.4)';
                    const timeGlow = isNewBatch ? '0 0 12px rgba(255, 204, 0, 0.4)' : 'none';

                    // Human-friendly descriptions
                    const descriptions = {
                        'ETL_MATCHES': 'Sincronização de partidas e atualização automática dos rakings e estatísticas.',
                        'AI_ANALYSIS': 'Análise de IA sobre o desempenho técnico e evolução da comunidade.'
                    };
                    const friendlyDesc = descriptions[p.process_name] || 'Processamento de rotina do sistema.';

                    // Safe Date formatting
                    let timeStr = '--:--';
                    try {
                        const d = new Date(p.dt_updated || p.dt_started);
                        timeStr = d.toLocaleTimeString();
                    } catch (dErr) { console.warn('Invalid date:', p.dt_updated); }

                    return `
                        <div class="process-item" style="${hasError ? 'border-left: 4px solid var(--accent-red);' : ''}; ${!isNewBatch ? 'opacity: 0.7;' : ''}">
                            <div>
                                <div class="process-name">${p.process_name || 'Sem nome'}</div>
                                <div style="font-size: 0.75rem; opacity: 0.6; margin-bottom: 4px;">${friendlyDesc}</div>
                                <div class="process-step">${p.step_name || '...'}</div>
                                ${hasError ? `<div style="color: var(--accent-red); font-size: 0.7rem; margin-top: 5px;">❌ ${metadataStr || 'Erro inesperado'}</div>` : ''}
                            </div>
                            <div>
                                <div class="progress-bar-container">
                                    <div class="progress-fill ${p.status === 'WORKING' ? 'pulse' : ''} status-${p.status}" style="width: ${p.progress || 0}%"></div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: center;">
                                <span class="status-badge status-${p.status || 'UNKNOWN'}" style="${!isNewBatch ? 'filter: grayscale(0.5);' : ''}">${p.status === 'WORKING' ? 'EM EXECUÇÃO' : (p.status || 'OK')}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: ${timeColor}; font-weight: 700; text-align: right; text-shadow: ${timeGlow}; transition: all 0.5s;">
                                ${timeStr}
                            </div>
                        </div>
                    `;
                } catch (itemErr) {
                    console.error('[MONITORING] Failed to render item:', p, itemErr);
                    return '';
                }
            }).join('');
        } catch (err) {
            console.error('[MONITORING] Fatal render error:', err);
            this.processList.innerHTML = '<div class="process-item" style="color: var(--accent-red)">Erro crítico ao desenhar lista. Verifique o console.</div>';
        }
    }
}

// Auto-boot
new MonitoringModule();
