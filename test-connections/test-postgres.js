const { Client } = require('pg');

async function testPostgres() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'challenge_db',
    user: 'postgres',
    password: 'password',
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL!');

    const res = await client.query('SELECT NOW()');
    console.log('✅ Query executada:', res.rows[0]);

    await client.end();
    console.log('✅ Conexão fechada!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testPostgres();