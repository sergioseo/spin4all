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
        this.btnRunEtl = document.getElementById('btn-run-etl');
        this.lastUpdate = document.getElementById('last-update');
        this.init();
    }

    async init() {
        console.log('[MONITORING] Initializing dashboard...');
        await this.refresh();
        setInterval(() => this.refresh(), 5000); // Polling every 5s

        if (this.btnRunEtl) {
            this.btnRunEtl.addEventListener('click', () => this.triggerJob('ETL_MATCHES', this.btnRunEtl, '/api/admin/monitoring/trigger-etl'));
        }
        
        const btnRunAnalysis = document.getElementById('btn-run-analysis');
        if (btnRunAnalysis) {
            btnRunAnalysis.addEventListener('click', () => this.triggerJob('AI_ANALYSIS', btnRunAnalysis, '/api/admin/monitoring/trigger-analysis'));
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
                    
                    // Human-friendly descriptions
                    const descriptions = {
                        'ETL_MATCHES': 'Sincronização de partidas e atualização automática dos rakings e estatísticas.',
                        'AI_ANALYSIS': 'Análise de IA sobre o desempenho técnico e evolução da comunidade.'
                    };
                    const friendlyDesc = descriptions[p.process_name] || 'Processamento de rotina do sistema.';

                    // Safe Date formatting
                    let timeStr = '--:--';
                    try {
                        if (p.dt_updated) {
                            timeStr = new Date(p.dt_updated).toLocaleTimeString();
                        } else if (p.dt_started) {
                            timeStr = new Date(p.dt_started).toLocaleTimeString();
                        }
                    } catch (dErr) { console.warn('Invalid date:', p.dt_updated); }

                    return `
                        <div class="process-item" style="${hasError ? 'border-left: 4px solid var(--accent-red);' : ''}">
                            <div>
                                <div class="process-name">${p.process_name || 'Sem nome'}</div>
                                <div style="font-size: 0.75rem; opacity: 0.6; margin-bottom: 4px;">${friendlyDesc}</div>
                                <div class="process-step">${p.step_name || '...'}</div>
                                ${hasError ? `<div style="color: var(--accent-red); font-size: 0.7rem; margin-top: 5px;">❌ ${metadataStr || 'Erro inesperado'}</div>` : ''}
                            </div>
                            <div>
                                <div class="progress-bar-container">
                                    <div class="progress-fill ${p.status === 'WORKING' ? 'pulse' : ''}" style="width: ${p.progress || 0}%"></div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: center;">
                                <span class="status-badge status-${p.status || 'UNKNOWN'}">${p.status === 'WORKING' ? 'EM EXECUÇÃO' : (p.status || 'OK')}</span>
                            </div>
                            <div style="font-size: 0.75rem; opacity: 0.5; text-align: right;">
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
