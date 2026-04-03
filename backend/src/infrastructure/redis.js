const IORedis = require('ioredis');

/**
 * Singleton de conexão com o Redis
 */
let connection;

if (process.env.REDIS_URL) {
    console.log('[DEBUG] Usando REDIS_URL para conexão...');
    connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null
    });
} else {
    console.log('[DEBUG] Usando Host/Port/Pass para conexão...');
    connection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
    });
}

connection.on('connect', () => console.log('✅ [REDIS] Tentando conexão...'));
connection.on('ready', () => console.log('🚀 [REDIS] Conexão ESTABELECIDA e pronta para uso.'));
connection.on('error', (err) => console.error('❌ [REDIS] Erro de conexão:', err.message));
connection.on('reconnecting', () => console.warn('⚠️ [REDIS] Reconectando...'));

module.exports = connection;
