/**
 * SPIN4ALL: Minimal Debug Server
 * Use este arquivo para testar se o Node consegue ouvir a porta 3456.
 */

const express = require('express');
const app = express();
const PORT = 3456;

console.log('--- DEBUG SERVER STARTING ---');

app.get('/', (req, res) => {
    console.log(`[REQ] ${new Date().toLocaleTimeString()} - Alguém bateu na porta!`);
    res.send('<h1>O NODE ESTÁ VIVO! 🚀</h1><p>Se você está vendo isso, o problema não é a porta 3456.</p>');
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ [DEBUG] Servidor ouvindo em http://127.0.0.1:${PORT}`);
    console.log('Abra o navegador e tente o link acima.');
});
