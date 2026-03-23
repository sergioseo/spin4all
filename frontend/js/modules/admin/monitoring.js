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

    updateStats(stats) {
        this.stats.total.textContent = stats.total || 0;
        this.stats.success.textContent = stats.success || 0;
        this.stats.fail.textContent = stats.fail || 0;
        this.stats.working.textContent = stats.working || 0;
    }

    renderProcesses(processes) {
        if (!processes || processes.length === 0) {
            this.processList.innerHTML = '<div class="process-item" style="opacity: 0.5">Nenhum processo registrado hoje.</div>';
            return;
        }

        this.processList.innerHTML = processes.map(p => {
            const hasError = p.status === 'FAIL';
            const metadataStr = p.metadata ? (typeof p.metadata === 'object' ? JSON.stringify(p.metadata) : p.metadata) : '';
            
            return `
                <div class="process-item" style="${hasError ? 'border-left: 4px solid var(--accent-red);' : ''}">
                    <div>
                        <div class="process-name">${p.process_name}</div>
                        <div class="process-step">${p.step_name}</div>
                        ${hasError ? `<div style="color: var(--accent-red); font-size: 0.7rem; margin-top: 5px;">❌ ${metadataStr || 'Erro inesperado'}</div>` : ''}
                    </div>
                    <div>
                        <div class="progress-bar-container">
                            <div class="progress-fill ${p.status === 'WORKING' ? 'pulse' : ''}" style="width: ${p.progress}%"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <span class="status-badge status-${p.status}">${p.status === 'WORKING' ? 'EM EXECUÇÃO' : p.status}</span>
                    </div>
                    <div style="font-size: 0.75rem; opacity: 0.5; text-align: right;">
                        ${new Date(p.dt_updated).toLocaleTimeString()}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Auto-boot
new MonitoringModule();
