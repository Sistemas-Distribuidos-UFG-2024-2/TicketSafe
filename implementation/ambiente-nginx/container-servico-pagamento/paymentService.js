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
    // Verifica se a reserva existe no Redis
    const reservaExiste = await redisClient.exists(reservationKey);
    if (!reservaExiste) {
      return res.status(404).send({ message: 'Reserva não encontrada' });
    }


    //
    // Aqui seria incluido a logica que checa ou confirma o pagamento no servico de pagamento externo - por exemplo pagamento em cartão, estamos desconsiderando pagamentos
    // assincronos com callbacks
    //
    await redisClient.persist(reservationKey); // Remove a expiração
    await redisClient.set(reservationKey, 'true'); // Atualiza o status para 'true'

    // Query para inserir ou atualizar o pagamento no PostgreSQL
    const upsertQuery = `
      INSERT INTO reservas (evento_id, user_id, "timestamp", quantidade, pagamento_efetuado, data_pagamento)
      VALUES ($1, $2, $3, $4, TRUE, EXTRACT(EPOCH FROM NOW()) * 1000)
      ON CONFLICT (evento_id, user_id, "timestamp")
      DO UPDATE SET
        pagamento_efetuado = TRUE,
        data_pagamento = EXCLUDED.data_pagamento;
    `;

    // Executa a query de upsert
    await pgClient.query(upsertQuery, [eventoId, userId, timestamp, quantidade]);

    // Publica uma mensagem de confirmação no canal de confirmações
    await redisClient.publish('reservas_confirmadas', reservationKey);

    res.status(200).send({ message: 'Pagamento confirmado e reserva atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao confirmar o pagamento:', err);
    res.status(500).send('Erro ao confirmar o pagamento');
  }
});


// Função para adquirir o lock distribuído no Redis
async function acquireLock(lockKey, lockTimeout) {
  // Tenta adquirir o lock com um tempo de expiração (ex: 30 segundos)
  const result = await redisClient.set(lockKey, 'locked', 'NX', 'EX', lockTimeout);
  return result === 'OK'; // Se a chave foi criada, o lock foi adquirido
}

// Função para processar pagamentos recentes persistidos recentemente no POSTGRESQL em caso de crashes no Redis
async function processarPagamentosRecentes() {
  const lockKey = 'lock:processarPagamentos'; // Chave de lock distribuído
  const lockTimeout = 600; // Tempo de expiração do lock em segundos (para evitar deadlocks)

  try {
    // Tenta adquirir o lock
    const lockAcquired = await acquireLock(lockKey, lockTimeout);
    if (!lockAcquired) {
      console.log('Outro worker está processando os pagamentos. Tentando novamente...');
      return; // Se não conseguiu adquirir o lock, não prossegue com o processamento
    }

    // Defina o intervalo de tempo que você quer verificar (por exemplo, últimos 30 minutos)
    const intervaloDeTempo = 30; // minutos
    const tempoLimite = Date.now() - intervaloDeTempo * 60 * 1000; // Calcula o limite de tempo em milissegundos

    // Consulta no PostgreSQL para pegar pagamentos confirmados nos últimos 30 minutos
    const query = `
      SELECT evento_id, user_id, timestamp, quantidade, data_pagamento 
      FROM reservas 
      WHERE pagamento_efetuado = TRUE 
        AND data_pagamento > $1
    `;
    const res = await pgClient.query(query, [tempoLimite]);
    const reservasRecentes = res.rows;

    if (reservasRecentes.length === 0) {
      console.log('Nenhuma reserva recente encontrada no banco.');
      return;
    }

    // Inicia o pipeline do Redis para checar a existência das chaves
    const pipeline = redisClient.pipeline();

    reservasRecentes.forEach((reserva) => {
      const { evento_id, user_id, timestamp, quantidade } = reserva;
      const reservationKey = `reserva:${evento_id}:${user_id}:${timestamp}:${quantidade}`;

      // Verifica se a chave de reserva existe no Redis
      pipeline.exists(reservationKey); // Usa EXISTS ao invés de GET para checagem de existência
    });

    // Executa todos os comandos EXISTS do pipeline
    const resultados = await pipeline.exec();

    // Novo pipeline para comandos de criação e publicação de reservas ausentes no Redis
    const pipeline2 = redisClient.pipeline();

    resultados.forEach(([err, exists], index) => {
      if (err) {
        console.error(`Erro ao verificar chave Redis: ${err}`);
        return;
      }

      const { evento_id, user_id, timestamp, quantidade } = reservasRecentes[index];
      const reservationKey = `reserva:${evento_id}:${user_id}:${timestamp}:${quantidade}`;
      
      // Adiciona os comandos persist, set e publish ao novo pipeline
      pipeline2.set(reservationKey, 'true'); // Cria a chave com o status de pagamento confirmado
      pipeline2.persist(reservationKey); // Remove a expiração caso a chave tenha expirado
      pipeline2.publish('reservas_confirmadas', reservationKey); // Publica a confirmação
      
      if (exists === 0) { 
        console.log(`Reserva encontrada no banco e agora recriada no REDIS, persistindo e avisando o worker confirm: ${reservationKey}`);
      }else{
        console.log(`Reserva encontrada no banco e também no REDIS, persistindo e avisando o worker confirm: ${reservationKey}`);
      }
    });

    // Executa todos os comandos do segundo pipeline
    await pipeline2.exec();

    console.log('Pagamentos confirmados para as reservas ausentes no Redis foram recriados e publicados.');

  } catch (err) {
    console.error('Erro ao processar pagamentos recentes:', err);
  } finally {
    // Libera o lock após o processamento
    await redisClient.del(lockKey);
  }
}

// Chama a função de inicialização durante o início do serviço
processarPagamentosRecentes();
// Inicia o PaymentService
const PORT = process.env.PORT || 4000; // Porta diferente para o serviço de pagamento
app.listen(PORT, () => {
  console.log(`PaymentService rodando na porta ${PORT}`);
});
