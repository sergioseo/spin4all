const ETLEngine = require('../../src/services/data/transformation/ETLEngine');

async function run() {
    try {
        await ETLEngine.processMatches();
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

run();
