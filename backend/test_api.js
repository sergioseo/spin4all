async function test() {
    const loginRes = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sjwseo@gmail.com', password: 'admin123' })
    });
    const { token } = await loginRes.json();
    console.log('Token:', token ? 'OK' : 'FAIL');

    if (!token) return;

    console.log('--- Testing /api/my-evolution ---');
    const evRes = await fetch('http://localhost:3000/api/my-evolution', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', evRes.status);
    console.log('Data:', await evRes.json());

    console.log('--- Testing /api/update-profile ---');
    const upRes = await fetch('http://localhost:3000/api/update-profile', {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            skills: { forehand: 88, backhand: 88 }
        })
    });
    console.log('Status:', upRes.status);
    console.log('Data:', await upRes.json());
}

test();
