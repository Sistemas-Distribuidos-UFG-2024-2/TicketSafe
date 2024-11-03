const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg'); // Importa o cliente PostgreSQL
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Conectado ao Redis'));

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
  console.log('Conectado ao PostgreSQL');
}

connectPostgres();

// Endpoint para criar uma reserva
app.post('/ingressos/reservar', async (req, res) => {
  const { eventoId, quantidade, userId } = req.body;

  if (!quantidade || quantidade <= 0) {
    return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  }

  if (!userId) {
    return res.status(400).send({ message: 'UUID do usuário é obrigatório' });
  }

  try {
    const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
    if (ingressosDisponiveis === null) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    if (quantidade > parseInt(ingressosDisponiveis)) {
      // Coloca a reserva na fila de espera
      await redisClient.lpush(`fila_espera:${eventoId}`, JSON.stringify({ userId, quantidade }));
      return res.status(200).send({ message: 'Ingressos esgotados, você foi colocado na fila de espera e uma nova tentativa ocorrerá caso volte a ter ingressos disponíveis. Não se preocupe caso isso aconteça você será notificado!' });
    }

    await redisClient.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
    
    const timestamp = Date.now();
    const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    await redisClient.hset(reservationKey, 'dummy', '');
    await redisClient.expire(reservationKey, 600);

    await pgClient.query(
      'INSERT INTO reservas(evento_id, user_id, quantidade, timestamp, pagamento_efetuado) VALUES ($1, $2, $3, $4, $5)',
      [eventoId, userId, quantidade, timestamp, 0]
    );

    res.status(200).send({ message: 'Reserva efetuada com sucesso, você tem 10 minutos para confirmar a compra!', timestamp });
  } catch (err) {
    console.error('Erro ao processar a reserva:', err);
    res.status(500).send('Erro ao processar a reserva');
  }
});


// Endpoint para cancelar uma reserva
app.post('/ingressos/cancelar', async (req, res) => {
  const { eventoId, quantidade, userId, timestamp } = req.body; // Inclui userId e timestamp no body

  if (!quantidade || quantidade <= 0) {
    return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  }

  if (!userId || !timestamp) {
    return res.status(400).send({ message: 'UUID do usuário e timestamp da reserva são obrigatórios' });
  }

  try {
    // Verifica se o evento existe no Redis
    const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
    if (ingressosDisponiveis === null) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Verifica se a reserva existe
    const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    const reservationExists = await redisClient.exists(reservationKey);

    if (reservationExists === 0) {
      return res.status(404).send({ message: 'Reserva não encontrada' });
    }

    // Incrementa os ingressos disponíveis no Redis
    await redisClient.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);

    // Remove a chave da reserva no Redis
    await redisClient.del(reservationKey);

    // Remove a reserva do PostgreSQL
    await pgClient.query(
      'DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3',
      [eventoId, userId, timestamp]
    );

    // Publica uma notificação no canal de reservas canceladas
    const message = `reserva_cancelada:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    redisClient.publish('reservas_canceladas', message);
    
    // Retorna confirmação ao usuário
    res.status(200).send({ message: 'Reserva cancelada e excluída com sucesso!' });
  } catch (err) {
    console.error('Erro ao cancelar a reserva:', err);
    res.status(500).send('Erro ao cancelar a reserva');
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de Reservas rodando na porta ${PORT}`);
});
