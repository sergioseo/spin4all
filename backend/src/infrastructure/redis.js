const IORedis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Singleton de conexão com o Redis
 * Garante que não criemos múltiplas conexões desnecessárias
 */
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Obrigatório para o BullMQ
};

const connection = new IORedis(redisConfig);

connection.on('connect', () => console.log('✅ [REDIS] Tentando conexão...'));
connection.on('ready', () => console.log('🚀 [REDIS] Conexão ESTABELECIDA e pronta para uso.'));
connection.on('error', (err) => console.error('❌ [REDIS] Erro de conexão:', err.message));
connection.on('reconnecting', () => console.warn('⚠️ [REDIS] Reconectando...'));

module.exports = connection;
