const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg');
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
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

// Endpoint para cadastrar um novo evento
app.post('/eventos/cadastrar', async (req, res) => {
  const { nome, ingressosDisponiveis } = req.body;

  if (!nome || ingressosDisponiveis === undefined) {
    return res.status(400).send({ message: 'Nome do evento e ingressos disponíveis são obrigatórios' });
  }

  try {
    // Insere o evento na tabela ingressos e retorna o ID gerado
    const result = await pgClient.query(
      'INSERT INTO ingressos (nome, ingressos_disponiveis) VALUES ($1, $2) RETURNING id',
      [nome, ingressosDisponiveis]
    );
    const id = result.rows[0].id;

    // Armazena o evento no Redis com o id
    await redisClient.set(`evento:${id}:ingressosDisponiveis`, ingressosDisponiveis);

    res.status(201).send({ message: 'Evento cadastrado com sucesso!', eventoId: id, nome });
  } catch (err) {
    console.error('Erro ao cadastrar o evento:', err);
    res.status(500).send('Erro ao cadastrar o evento');
  }
});

// Endpoint para excluir um evento
app.delete('/eventos/excluir', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send({ message: 'Id do evento é obrigatório' });
  }

  try {
    // Verifica se o evento existe no Redis
    const exists = await redisClient.exists(`evento:${id}:ingressosDisponiveis`);

    if (!exists) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Iniciar transação no Redis
    const transaction = redisClient.multi();
    
    // Remove o evento do Redis
    transaction.del(`evento:${id}:ingressosDisponiveis`);

    // Executa a transação no Redis
    await transaction.exec();

    // Remove o evento da tabela ingressos no PostgreSQL
    await pgClient.query('DELETE FROM ingressos WHERE id = $1', [id]);

    res.status(200).send({ message: 'Evento excluído com sucesso!' });
  } catch (err) {
    console.error('Erro ao excluir o evento:', err);
    res.status(500).send('Erro ao excluir o evento');
  }
});


// Endpoint para atualizar um evento
app.put('/eventos/atualizar', async (req, res) => {
  const { id, ingressosDisponiveis } = req.body;

  if (!id || ingressosDisponiveis === undefined) {
    return res.status(400).send({ message: 'Id do evento e nova quantidade de ingressos disponíveis são obrigatórios' });
  }

  try {
    // Verifica se o evento existe no Redis
    const exists = await redisClient.exists(`evento:${id}:ingressosDisponiveis`);

    if (!exists) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Iniciar transação no Redis
    const transaction = redisClient.multi();
    
    // Atualiza o evento no Redis
    transaction.set(`evento:${id}:ingressosDisponiveis`, ingressosDisponiveis);
    
    // Publica uma notificação para cada ingresso disponível
    for (let i = 0; i < ingressosDisponiveis; i++) {
      const message = `reserva_cancelada:${id}:${""}:${""}:${""}`;
      transaction.publish('reservas_canceladas', message);
    }
    
    // Executa a transação no Redis
    await transaction.exec();

    // Atualiza o evento na tabela ingressos no PostgreSQL
    await pgClient.query(
      'UPDATE ingressos SET ingressos_disponiveis = $1 WHERE id = $2',
      [ingressosDisponiveis, id]
    );

    res.status(200).send({ message: 'Evento atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar o evento:', err);
    res.status(500).send('Erro ao atualizar o evento');
  }
});



// Endpoint para listar todos os eventos
app.get('/eventos/listar', async (req, res) => {
  try {
    // Recupera todos os eventos da tabela ingressos
    const result = await pgClient.query('SELECT id, ingressos_disponiveis, nome FROM ingressos');
    const eventos = result.rows;

    res.status(200).send(eventos);
  } catch (err) {
    console.error('Erro ao listar eventos:', err);
    res.status(500).send('Erro ao listar eventos');
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de Eventos rodando na porta ${PORT}`);
});
