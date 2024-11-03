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

    // Obtendo os ingressos disponíveis do banco de dados
    const ingressosRes = await pgClient.query('SELECT id, ingressos_disponiveis FROM ingressos');
    const ingressos = ingressosRes.rows;

    for (const ingresso of ingressos) {
      await redisClient.set(`evento:${ingresso.id}:ingressosDisponiveis`, ingresso.ingressos_disponiveis);
      console.log(`Ingressos disponíveis para o evento ${ingresso.id} sincronizados no Redis.`);
    }

    // Obtendo as reservas do banco de dados
    const reservasRes = await pgClient.query('SELECT * FROM reservas');
    const reservas = reservasRes.rows;

    for (const reserva of reservas) {
      const {evento_id, user_id, quantidade, timestamp , pagamento_efetuado, } = reserva;

      const currentTime = new Date();
      const reservaTimestamp = new Date(timestamp);
      const tenMinutesInMillis = 10 * 60 * 1000;
      const expirationTime = reservaTimestamp.getTime() + tenMinutesInMillis;

      // Formata a chave única para a reserva
      const reservationKey = `reserva:${evento_id}:${user_id}:${timestamp}:${quantidade}`;

      if (pagamento_efetuado === 1) {
        // Se o pagamento foi efetuado, recria a reserva e notifica o worker de confirmação
        await redisClient.hset(reservationKey, 'dummy', ''); // Cria um hash com um campo "dummy"
        console.log(`Reserva confirmada recriada para o evento ${evento_id}.`);
        // Enviar notificação para o worker de confirmação
        await redisClient.publish('reservas_confirmadas', reservationKey);
      } else if (pagamento_efetuado === 0) {
        // Se o pagamento não foi efetuado, recria a reserva com o tempo de expiração
        if (expirationTime > currentTime.getTime()) {
          const remainingTime = expirationTime - currentTime.getTime();
          await redisClient.hset(reservationKey, 'dummy', ''); // Cria um hash com um campo "dummy"
          await redisClient.expire(reservationKey, Math.ceil(remainingTime / 1000)); // Define o tempo de expiração
          console.log(`Reserva não paga recriada com expiração de ${Math.ceil(remainingTime / 1000)} segundos para o evento ${evento_id}.`);
        } else {
          // A expiração foi ultrapassada, remove o registro do PostgreSQL
          await pgClient.query('DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3', [evento_id, user_id, timestamp]);
          console.log(`Reserva de timestamp: ${timestamp} ignorada e removida do banco de dados, expiração ultrapassada.`);
        }
      }
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
