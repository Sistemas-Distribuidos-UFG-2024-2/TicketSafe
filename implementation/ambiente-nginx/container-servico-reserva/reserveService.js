const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg');
const cluster = require('cluster');
const os = require('os'); // Para obter o número de núcleos de CPU

const app = express();
app.use(express.json());

// Configuração do Redis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Conectado ao Redis'));

// Configuração do PostgreSQL
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

// Função para iniciar o servidor
function startServer() {
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
      // const eventoExiste = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
      // if (eventoExiste === null) {
      //   return res.status(404).send({ message: 'Evento não encontrado' });
      // }

      // await redisClient.lpush(`fila_espera:${eventoId}`, JSON.stringify({ userId, quantidade }));
      const message = `reserva_cancelada:${eventoId}:${userId}:${""}:${quantidade}`;
      await redisClient.publish('reservas_canceladas', message);

      res.status(200).send({
        message: 'Ordem de reserva realizada, você está na nossa fila de reservas e será notificado quando ela for efetuada!'
      });
    } catch (err) {
      console.error('Erro ao processar a reserva:', err);
      res.status(500).send('Erro ao processar a reserva');
    }
  });

  // //FUNCAO RESERVAR OPCAO COM REDIS STREAM
  
  // app.post('/ingressos/reservar', async (req, res) => {
  //   const { eventoId, quantidade, userId } = req.body;

  //   if (!quantidade || quantidade <= 0) {
  //     return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  //   }

  //   if (!userId) {
  //     return res.status(400).send({ message: 'UUID do usuário é obrigatório' });
  //   }

  //   try {
  //     const eventoExiste = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
  //     if (eventoExiste === null) {
  //       return res.status(404).send({ message: 'Evento não encontrado' });
  //     }

  //     // Envia a requisição de reserva para o stream
  //     await redisClient.xadd('reservas_stream', '*', 'eventoId', eventoId, 'userId', userId, 'quantidade', quantidade);

  //     res.status(200).send({
  //       message: 'Ordem de reserva realizada, você está na nossa fila de reservas e será notificado quando ela for efetuada!'
  //     });
  //   } catch (err) {
  //     console.error('Erro ao processar a reserva:', err);
  //     res.status(500).send('Erro ao processar a reserva');
  //   }
  // });
  

  // Endpoint para cancelar uma reserva
  app.post('/ingressos/cancelar', async (req, res) => {
    const { eventoId, quantidade, userId, timestamp } = req.body;

    if (!quantidade || quantidade <= 0) {
      return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
    }

    if (!userId || !timestamp) {
      return res.status(400).send({ message: 'UUID do usuário e timestamp da reserva são obrigatórios' });
    }

    try {
      // const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
      // if (ingressosDisponiveis === null) {
      //   return res.status(404).send({ message: 'Evento não encontrado' });
      // }

      const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
      const reservationExists = await redisClient.exists(reservationKey);

      if (reservationExists === 0) {
        return res.status(404).send({ message: 'Reserva não encontrada' });
      }

      const cancelTransaction = redisClient.multi();
      cancelTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
      cancelTransaction.del(reservationKey);

      for (let i = 0; i < quantidade; i++) {
        const message = `reserva_cancelada:${eventoId}:${userId}:${timestamp}:${quantidade}`;
        cancelTransaction.publish('reservas_solicitadas', message);
      }

      await cancelTransaction.exec();
      res.status(200).send({ message: 'Reserva cancelada e excluída com sucesso!' });
    } catch (err) {
      console.error('Erro ao cancelar a reserva:', err);
      res.status(500).send('Erro ao cancelar a reserva');
    }
  });

  const numForks = Number(process.env.CLUSTER_WORKERS) || 1;
  const numCPUs = require('os').cpus().length;

  if(cluster.isPrimary && process.env.CLUSTER === 'true'){
      console.log(`index.js: Primary ${process.pid} is running`);
  
      for (let i = 0; i < numForks; i++) {
        cluster.fork();
        console.log(`forking cluster to:${i}`)
      }
  
      cluster.on('exit', (worker, code, signal) => {
          console.log(`index.js: worker ${worker.process.pid} died: code ${code} signal ${signal}`);
      });
  } else {
      const PORT = process.env.PORT || 3000;
      const serverApp = app.listen(PORT, () => {
          console.log(`index.js:${process.pid}`);
      });
  
      if (process.env.USE_TIMEOUT === 'true') {
          serverApp.setTimeout(TIMEOUT)
          console.log(`Starting with timeout as ${TIMEOUT}ms`)
  
          serverApp.on('timeout', (socket) => {
              console.log(`Timing out connection`);
              socket.end();
          })
      }
  }
}

startServer()