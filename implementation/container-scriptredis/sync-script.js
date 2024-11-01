const Redis = require('ioredis');
const { Client } = require('pg');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

const pgClient = new Client({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'user',
  password: process.env.PG_PASSWORD || 'password',
  database: process.env.PG_DATABASE || 'reservas'
});

async function waitForPostgres() {
  for (let i = 0; i < 10; i++) {
    try {
      await pgClient.connect();
      console.log('Conectado ao PostgreSQL');
      return true;
    } catch (error) {
      console.log('Aguardando PostgreSQL para iniciar...', error);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos antes de tentar novamente
    }
  }
  throw new Error('PostgreSQL não está acessível após várias tentativas');
}

async function sincronizarRedisComPostgres() {
  try {
    await waitForPostgres();

    const res = await pgClient.query('SELECT id, ingressos_disponiveis FROM ingressos');
    const eventos = res.rows;

    for (const evento of eventos) {
      await redisClient.set(`evento:${evento.id}:ingressosDisponiveis`, evento.ingressos_disponiveis);
    }
    console.log('Sincronização concluída');
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
  } finally {
    await pgClient.end();
    await redisClient.quit(); // Feche a conexão com o Redis
    process.exit(0); // Certifique-se de que o script termina
  }
}

sincronizarRedisComPostgres();
