import { CONFIG } from '../../config.js';

class MonitoringModule {
    constructor() {
        this.processList = document.getElementById('process-list');
        this.stats = {
            total: document.getElementById('stat-total'),
            success: document.getElementById('stat-success'),
        };
        this.statFail = document.getElementById('stat-fail');
        this.statWorking = document.getElementById('stat-working');
        this.btnRunEtl = document.getElementById('btn-run-etl');
        this.lastUpdate = document.getElementById('last-update');
        this.init();
    }

    async init() {
        console.log('[MONITORING] Initializing dashboard...');
        await this.refresh();
        setInterval(() => this.refresh(), 5000); // Polling every 5s

        if (this.btnRunEtl) {
            this.btnRunEtl.addEventListener('click', () => this.triggerJob('ETL_MATCHES'));
        }
    }

    async triggerJob(jobName) {
        try {
            const token = localStorage.getItem('spin4all_token');
            this.btnRunEtl.disabled = true;
            this.btnRunEtl.textContent = '⌛ Enfileirando...';

            const res = await fetch('/api/admin/monitoring/trigger-etl', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (data.success) {
                // Refresh immediately to show the "WORKING" status
                this.refresh();
            } else {
                alert('Erro ao disparar: ' + data.error);
            }
        } catch (err) {
            console.error('[MONITORING] Trigger failed:', err);
        } finally {
            this.btnRunEtl.disabled = false;
            this.btnRunEtl.textContent = '🚀 Rodar ETL de Partidas';
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

        this.processList.innerHTML = processes.map(p => `
            <div class="process-item">
                <div>
                    <div class="process-name">${p.process_name}</div>
                    <div class="process-step">${p.step_name}</div>
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
        `).join('');
    }
}

// Auto-boot
new MonitoringModule();
