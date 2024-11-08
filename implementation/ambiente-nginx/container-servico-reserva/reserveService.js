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

// // Configurações do PostgreSQL
// const pgClient = new Client({
//   host: process.env.PG_HOST || 'localhost',
//   port: process.env.PG_PORT || 5432,
//   user: process.env.PG_USER || 'user',
//   password: process.env.PG_PASSWORD || 'password',
//   database: process.env.PG_DATABASE || 'reservas'
// });

// async function connectPostgres() {
//   await pgClient.connect();
//   console.log('Conectado ao PostgreSQL');
// }

// connectPostgres();

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
    // Verifica se o evento existe no Redis
    const eventoExiste = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
    if (eventoExiste === null) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    //Envia a requisicao de reserva para a fila e publica uma notificação para o worker!

    await redisClient.lpush(`fila_espera:${eventoId}`, JSON.stringify({ userId, quantidade }));
    const message = `reserva_cancelada:${eventoId}:${userId}:${""}:${quantidade}`;
    await redisClient.publish('reservas_canceladas', message);
    // // Iniciar transação
    // const transaction = redisClient.multi();
    
    // // Decrementar ingressos disponíveis
    // transaction.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
    
    // // Executar transação
    // const results = await transaction.exec();

    // // Verificar resultado do decremento
    // const ingressosRestantes = results[0];

    // if (ingressosRestantes[1] < 0) {
    //   // Não há ingressos suficientes; reverter o decremento
    //   const revertTransaction = redisClient.multi();
    //   revertTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
      
    //   // Verifica se o usuário já está na fila de espera
    //   const userInQueueExists = await redisClient.lrange(`fila_espera:${eventoId}`, 0, -1);
    //   const userInQueue = userInQueueExists.some(reserva => JSON.parse(reserva).userId === userId);
      
    //   if (!userInQueue) {
    //     // Se o usuário não estiver na fila, adiciona o usuário à fila de espera
    //     revertTransaction.lpush(`fila_espera:${eventoId}`, JSON.stringify({ userId, quantidade }));
    //     await revertTransaction.exec();
    //   } else {
    //     await revertTransaction.exec();
    //     return res.status(400).send({
    //       message: 'Você já está na fila de espera para este evento.',
    //     });
    //   }

      
    //   return res.status(200).send({
    //     message: 'Ingressos esgotados, você foi colocado na fila de espera. Você será notificado caso ingressos estejam disponíveis!',
    //   });
    // }

    // // Se ingressos foram suficientes, prossegue com a reserva
    // const timestamp = Date.now();
    // const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    
    // // Pipelining Redis operations
    // const pipeline = redisClient.pipeline();
    // pipeline.hset(reservationKey, 'dummy', '');
    // pipeline.expire(reservationKey, 600);
    // await pipeline.exec();

    // // // Salvar a reserva no banco de dados
    // // await pgClient.query(
    // //   'INSERT INTO reservas(evento_id, user_id, quantidade, timestamp, pagamento_efetuado) VALUES ($1, $2, $3, $4, $5)',
    // //   [eventoId, userId, quantidade, timestamp, 0]
    // // );

    res.status(200).send({
      message: 'Ordem de reserva realizada, você está na nossa fila de reservas e será notificado quando ela for efetuada!'
    });
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

    // Iniciar transação para cancelamento
    const cancelTransaction = redisClient.multi();
    
    // Incrementa os ingressos disponíveis no Redis
    cancelTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
    
    // Remove a chave da reserva no Redis
    cancelTransaction.del(reservationKey);
    
    // Publica uma notificação para cada ingresso cancelado
    for (let i = 0; i < quantidade; i++) {
      const message = `reserva_cancelada:${eventoId}:${userId}:${timestamp}:${quantidade}`;
      cancelTransaction.publish('reservas_canceladas', message);
    }
    
    // Executa a transação
    await cancelTransaction.exec();

    // // Remove a reserva do PostgreSQL
    // await pgClient.query(
    //   'DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3',
    //   [eventoId, userId, timestamp]
    // );

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
