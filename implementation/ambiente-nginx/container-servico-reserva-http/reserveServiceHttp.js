
const express = require('express');
const Redis = require('ioredis');
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
      // publica uma mensagem ou requisição no canal de STREAM para os workers disponiveis
      await redisClient.xadd('reservas_pendentes', '*', 'eventoId', eventoId, 'userId', userId, 'quantidade', quantidade);

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
  const { eventoId, quantidade, userId, timestamp } = req.body;

  if (!quantidade || quantidade <= 0) {
    return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  }

  if (!userId || !timestamp) {
    return res.status(400).send({ message: 'UUID do usuário e timestamp da reserva são obrigatórios' });
  }

  try {
    const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    const reservationExists = await redisClient.exists(reservationKey);

    if (reservationExists === 0) {
      return res.status(404).send({ message: 'Reserva não encontrada' });
    }

    // Define a expiração com 1 segundo da chave (ao invés de deletar)
    await redisClient.expire(reservationKey, 1);  // Expiração de 1 segundo

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
          serverApp.setTimeout(5000)
          console.log(`Starting with timeout as ${TIMEOUT}ms`)
  
          serverApp.on('timeout', (socket) => {
              console.log(`Timing out connection`);
              socket.end();
          })
      }
  }
}

startServer()