const { Queue } = require('bullmq');
const connection = require('../redis');

/**
 * Gerenciador de Filas do Spin4All
 * Centraliza a criação e acesso às filas do BullMQ
 */
class QueueManager {
    constructor() {
        this.queues = {};
    }

    /**
     * Obtém ou cria uma fila pelo nome
     */
    getQueue(name) {
        if (!this.queues[name]) {
            this.queues[name] = new Queue(name, { 
                connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: true, // Limpa o redis após sucesso
                    removeOnFail: 100 // Mantém os últimos 100 erros para auditoria
                }
            });
            console.log(`📡 [QUEUE] Fila '${name}' inicializada.`);
        }
        return this.queues[name];
    }

    /**
     * Espera a conexão do Redis estabilizar antes de prosseguir
     */
    async waitForConnection(timeout = 5000) {
        if (connection.status === 'ready') return true;

        console.log(`[DEBUG] Redis em estado '${connection.status}'. Aguardando até ${timeout}ms...`);
        
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                connection.removeListener('ready', onReady);
                resolve(false);
            }, timeout);

            const onReady = () => {
                clearTimeout(timer);
                resolve(true);
            };

            connection.once('ready', onReady);
        });
    }

    /**
     * Adiciona um job a uma fila específica
     */
    async addJob(queueName, jobName, data) {
        console.log(`[DEBUG] Tentando enfileirar job '${jobName}' na fila '${queueName}'...`);
        
        // Vamos apenas logar o status, mas confiar no BullMQ para gerenciar a fila.
        // O BullMQ internamente aguarda a conexão se ela estiver em 'reconnecting'.
        console.log(`[DEBUG] Status atual do Redis: ${connection.status}`);

        try {
            const queue = this.getQueue(queueName);
            const job = await queue.add(jobName, data);
            console.log(`✅ [DEBUG] Job '${jobName}' enfileirado com ID: ${job.id}`);
            return job;
        } catch (err) {
            console.error(`❌ [QUEUE ERROR] Falha ao adicionar job:`, err);
            throw err;
        }
    }
}

module.exports = new QueueManager();
