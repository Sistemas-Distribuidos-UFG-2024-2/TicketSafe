const Redis = require('ioredis');
const { Client } = require('pg');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

// Configurações do PostgreSQL
const pgClient = new Client({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'user',
  password: process.env.PG_PASSWORD || 'password',
  database: process.env.PG_DATABASE || 'reservas'
});

async function connectPostgres() {
  await pgClient.connect();
  console.log('Worker conectado ao PostgreSQL');
}

connectPostgres();

// Função de sincronização
async function sincronizarIngressos() {
  try {
    // Obtém os eventos do PostgreSQL
    const res = await pgClient.query('SELECT id, ingressos_disponiveis FROM ingressos');
    const eventos = res.rows;

    for (const evento of eventos) {
      const eventoId = evento.id;

      // Obtém a contagem atual de ingressos disponíveis no Redis
      const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);

      if (ingressosDisponiveis !== null) {
        // Atualiza o PostgreSQL com o valor do Redis
        await pgClient.query(
          'UPDATE ingressos SET ingressos_disponiveis = $1 WHERE id = $2',
          [parseInt(ingressosDisponiveis), eventoId]
        );
      }
    }
    console.log('Sincronização concluída');
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Executa a sincronização a cada 2 segundos
setInterval(sincronizarIngressos, 2000);
