const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const secret = process.env.JWT_SECRET;
console.log('Secret:', secret);

async function test() {
    const token = jwt.sign({ id: 1 }, secret);
    console.log('Token:', token);

    try {
        const res = await fetch('http://localhost:3000/api/analysis/tournament-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
