const { Client } = require('pg');

const passwords = [
    'Manolakisn55@',
    'ReplaceWithAStrongPassword123!'
];

async function testConnection(password) {
    console.log(`\nTesting password: ${password.substring(0, 3)}***...`);

    const client = new Client({
        user: 'gpsonwaves',
        host: '127.0.0.1',
        database: 'gpsonwaves',
        password: password,
        port: 5435,
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('✅ SUCCESS! Connected successfully.');
        console.log('Use this connection string:');
        const encoded = encodeURIComponent(password);
        console.log(`postgresql://gpsonwaves:${encoded}@127.0.0.1:5435/gpsonwaves`);
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        await client.end();
    }
}

async function run() {
    for (const p of passwords) {
        await testConnection(p);
    }
    console.log('\n❌ All attempts failed.');
}

run();
