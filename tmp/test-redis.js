const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  connectTimeout: 5000,
  retryStrategy: (times) => {
    if (times > 2) return null; // Para após 2 tentativas
    return 1000;
  }
});

console.log(`[REDIS:TEST] 📡 Connecting to ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}...`);

redis.on('connect', () => {
  console.log('✅ [REDIS:SUCCESS] Connection established!');
  redis.set('BOLT_TEST_KEY', 'OPERATIONAL_' + new Date().toISOString());
  redis.get('BOLT_TEST_KEY', (err, result) => {
    console.log(`🔑 [REDIS:DATA] Key verification: ${result}`);
    process.exit(0);
  });
});

redis.on('error', (err) => {
  console.error('❌ [REDIS:FAILURE] Connection failed:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⌛ [REDIS:TIMEOUT] Connection timed out.');
  process.exit(1);
}, 10000);
 stone
