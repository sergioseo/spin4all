const { runMigrations } = require('./backend/src/config/setup');

async function start() {
    await runMigrations();
    process.exit(0);
}

start();
