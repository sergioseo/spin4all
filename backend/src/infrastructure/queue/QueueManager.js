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
        
        // Aguarda estabilização (evita erro durante reinícios do servidor)
        const isReady = await this.waitForConnection();

        if (!isReady) {
            console.error(`❌ [QUEUE] Falha ao enfileirar: Redis status continua '${connection.status}'`);
            throw new Error(`Redis não está pronto após espera (Status: ${connection.status}).`);
        }

        console.log('[DEBUG] Redis pronto. Criando fila...');
        const queue = this.getQueue(queueName);
        console.log('[DEBUG] Fila obtida. Adicionando job...');
        const job = await queue.add(jobName, data);
        console.log(`[DEBUG] Job '${jobName}' enfileirado com ID: ${job.id}`);
        return job;
    }
}

module.exports = new QueueManager();
