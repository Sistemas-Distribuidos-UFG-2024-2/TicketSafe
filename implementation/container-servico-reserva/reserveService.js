const express = require('express');
const Redis = require('ioredis');
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Conectado ao Redis'));

// Endpoint para criar uma reserva
app.post('/ingressos/reservar', async (req, res) => {
  const { eventoId, quantidade } = req.body;

  if (!quantidade || quantidade <= 0) {
    return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  }

  try {
    // Verifica e decrementar os ingressos disponíveis no Redis
    const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
    if (ingressosDisponiveis === null) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    if (quantidade > parseInt(ingressosDisponiveis)) {
      return res.status(400).send({ message: 'Ingressos insuficientes' });
    }

    // Atualiza o número de ingressos disponíveis no Redis
    await redisClient.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);

    // Retorna confirmação ao usuário
    res.status(200).send({ message: 'Reserva efetuada com sucesso!' });
  } catch (err) {
    console.error('Erro ao processar a reserva:', err);
    res.status(500).send('Erro ao processar a reserva');
  }
});

// Endpoint para cancelar uma reserva
app.post('/ingressos/cancelar', async (req, res) => {
  const { eventoId, quantidade } = req.body;

  if (!quantidade || quantidade <= 0) {
    return res.status(400).send({ message: 'Quantidade de ingressos inválida' });
  }

  try {
    // Verifica se o evento existe no Redis
    const ingressosDisponiveis = await redisClient.get(`evento:${eventoId}:ingressosDisponiveis`);
    if (ingressosDisponiveis === null) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Incrementa os ingressos disponíveis no Redis
    await redisClient.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);

    // Retorna confirmação ao usuário
    res.status(200).send({ message: 'Reserva cancelada com sucesso!' });
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
