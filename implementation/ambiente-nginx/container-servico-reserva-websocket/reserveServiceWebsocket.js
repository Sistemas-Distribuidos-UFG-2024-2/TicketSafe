const WebSocket = require('ws');
const Redis = require('ioredis');
const cluster = require('cluster');
const os = require('os'); // Para obter o número de núcleos de CPU
const express = require('express');
const http = require('http');

// Configuração do Redis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Conectado ao Redis'));

// Função para lidar com mensagens WebSocket
function onError(ws, err) {
    console.error(`onError: ${err.message}`);
}

async function onMessage(ws, data) {
    console.log(`onMessage: ${data}`);
  
    try {
        const message = JSON.parse(data);
  
        if (message.command === 'reservar') {
            await processReservation(message, ws);
        } else if (message.command === 'cancelar') {
            await processCancellation(message, ws);
        } else {
            ws.send(JSON.stringify({ error: 'Comando inválido' }));
        }
    } catch (err) {
        console.error('Erro ao processar mensagem:', err);
        ws.send(JSON.stringify({ error: 'Erro ao processar sua solicitação' }));
    }
}
  

function onConnection(ws) {
    ws.on('message', data => onMessage(ws, data));
    ws.on('error', error => onError(ws, error));
    console.log(`Cliente WebSocket conectado`);
}

// Configuração do WebSocket Server
function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', onConnection);

    console.log('Servidor WebSocket está rodando!');
    return wss;
}

async function processReservation(message, ws) {
    const { eventoId, quantidade, userId } = message;
  
    if (!quantidade || quantidade <= 0) {
        ws.send(JSON.stringify({ error: 'Quantidade de ingressos inválida' }));
        return;
    }
  
    if (!userId) {
        ws.send(JSON.stringify({ error: 'UUID do usuário é obrigatório' }));
        return;
    }
  
    try {
        await redisClient.xadd('reservas_pendentes', '*', 'eventoId', eventoId, 'userId', userId, 'quantidade', quantidade);
        ws.send(JSON.stringify({ message: 'Ordem de reserva realizada, você está na nossa fila de reservas e será notificado quando ela for efetuada!' }));
    } catch (err) {
        console.error('Erro ao processar a reserva:', err);
        ws.send(JSON.stringify({ error: 'Erro ao processar a reserva' }));
    }
  }
  
  async function processCancellation(message, ws) {
    const { eventoId, quantidade, userId, timestamp } = message;
  
    if (!quantidade || quantidade <= 0) {
        ws.send(JSON.stringify({ error: 'Quantidade de ingressos inválida' }));
        return;
    }
  
    if (!userId || !timestamp) {
        ws.send(JSON.stringify({ error: 'UUID do usuário e timestamp da reserva são obrigatórios' }));
        return;
    }
  
    const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    try {
        const exists = await redisClient.exists(reservationKey);
        if (exists === 0) {
            ws.send(JSON.stringify({ error: 'Reserva não encontrada' }));
            return;
        }
  
        await redisClient.expire(reservationKey, 1); // Define expiração de 1 segundo
        ws.send(JSON.stringify({ message: 'Reserva cancelada e excluída com sucesso!' }));
    } catch (err) {
        console.error('Erro ao cancelar a reserva:', err);
        ws.send(JSON.stringify({ error: 'Erro ao cancelar a reserva' }));
    }
  }
  

// Função para iniciar o servidor HTTP e WebSocket
function startServer() {
    const app = express();
    const server = http.createServer(app);

    // Configuração do WebSocket
    setupWebSocketServer(server);

    const numForks = Number(process.env.CLUSTER_WORKERS) || os.cpus().length;

    if (cluster.isPrimary && process.env.CLUSTER === 'true') {
      console.log(`index.js: Primary ${process.pid} is running`);
  
      for (let i = 0; i < numForks; i++) {
        cluster.fork();
        console.log(`forking cluster to: ${i}`);
      }
  
      cluster.on('exit', (worker, code, signal) => {
        console.log(`index.js: worker ${worker.process.pid} died: code ${code} signal ${signal}`);
      });
    } else {
      const PORT = process.env.PORT || 3000;
      server.setTimeout(5000);
      // Captura o evento 'listening' para confirmar que o servidor iniciou corretamente
      server.listen(PORT);
      server.on('listening', () => {
          console.log(`Servidor escutando na porta ${PORT}`);
      });

      // Captura o evento 'error' para lidar com falhas ao iniciar o servidor
      server.on('error', (error) => {
          console.error('Erro ao iniciar o servidor:', error);
          if (error.code === 'EADDRINUSE') {
              console.error(`Porta ${PORT} já está em uso. Tente usar outra porta.`);
          } else if (error.code === 'EACCES') {
              console.error(`Permissão negada para a porta ${PORT}. Tente usar uma porta acima de 1024.`);
          } else {
              console.error('Erro desconhecido:', error);
          }
      });
  }
}

startServer();