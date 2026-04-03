const { Queue } = require('bullmq');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null
};

const governanceQueue = new Queue('governance_queue', { connection });

async function addGovernanceTask(executionId, input) {
  console.log(`[SPIN4ALL:QUEUE] 📨 Enfileirando tarefa ${executionId}...`);
  return await governanceQueue.add('deliberation_task', {
    executionId,
    input
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
}

module.exports = {
  addGovernanceTask,
  governanceQueue
};
