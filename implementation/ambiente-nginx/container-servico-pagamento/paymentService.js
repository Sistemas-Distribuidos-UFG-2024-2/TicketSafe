const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg'); // Importa o cliente PostgreSQL
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
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

// Conecta ao PostgreSQL
async function connectPostgres() {
  try {
    await pgClient.connect();
    console.log('Conectado ao PostgreSQL');
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
  }
}

connectPostgres();

redisClient.on('connect', () => console.log('PaymentService Conectado ao Redis'));

// Endpoint para confirmar o pagamento de uma reserva
app.post('/pagamentos/confirmar', async (req, res) => {
  const { eventoId, timestamp, userId, quantidade } = req.body;

  // Cria a chave de reserva no novo formato
  const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;

  try {
    // Verifica se a reserva existe
    const reservaExiste = await redisClient.exists(reservationKey);
    if (!reservaExiste) {
      return res.status(404).send({ message: 'Reserva não encontrada' });
    }

    await redisClient.persist(reservationKey); // Remove a expiração

    // Atualiza o pagamento no PostgreSQL
    const updateQuery = `
      UPDATE reservas 
      SET pagamento_efetuado = TRUE 
      WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3
    `;
    await pgClient.query(updateQuery, [eventoId, userId, timestamp]);

    // Publica uma mensagem de confirmação no canal de confirmações
    await redisClient.publish('reservas_confirmadas', reservationKey);

    res.status(200).send({ message: 'Pagamento confirmado e reserva atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao confirmar o pagamento:', err);
    res.status(500).send('Erro ao confirmar o pagamento');
  }
});

// Inicia o PaymentService
const PORT = process.env.PORT || 4000; // Porta diferente para o serviço de pagamento
app.listen(PORT, () => {
  console.log(`PaymentService rodando na porta ${PORT}`);
});
