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
     * Adiciona um job a uma fila específica
     */
    async addJob(queueName, jobName, data) {
        console.log(`[DEBUG] Tentando enfileirar job '${jobName}' na fila '${queueName}'...`);
        // Se o redis não estiver pronto, não adianta tentar enfileirar (evita o hang)
        if (connection.status !== 'ready') {
            console.error(`❌ [QUEUE] Falha ao enfileirar: Redis status é '${connection.status}'`);
            throw new Error(`Redis não está pronto (Status: ${connection.status}). Verifique a conexão.`);
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
