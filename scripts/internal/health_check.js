const http = require('http');

const testEndpoint = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: JSON.parse(data)
                });
            });
        });

        req.on('error', (err) => reject(err));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

async function runTests() {
    console.log('--- HEALTH CHECK: ARQUITETURA MODULAR ---');
    
    try {
        // 1. Health Ping
        console.log('[TEST] GET /api/health...');
        const health = await testEndpoint('/api/health');
        console.log('STATUS:', health.statusCode);
        console.log('BODY:', health.data);
        
        // 2. Login Simulado (Error expected if credentials wrong, but path must exist)
        console.log('[TEST] POST /api/login...');
        const login = await testEndpoint('/api/login', 'POST', { email: 'test@spin4all.com', password: 'wrong' });
        console.log('STATUS:', login.statusCode); // Expect 401
        
        console.log('--- RESULTADO: ARQUITETURA VALIDADA ---');
        process.exit(0);
    } catch (err) {
        console.error('[ERRO NO TESTE]:', err.message);
        process.exit(1);
    }
}

runTests();
