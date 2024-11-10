const Redis = require('ioredis');
const { Client } = require('pg');  // Importando o cliente PostgreSQL

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Worker de Fila de Espera Conectado ao Redis'));
subscriber.on('connect', () => {
    console.log('Worker de Fila de Espera Conectado ao Redis');
});

// // Conexão com o PostgreSQL
// const pgClient = new Client({
//     host: process.env.PG_HOST || 'postgres',
//     port: process.env.PG_PORT || 5432,
//     user: process.env.PG_USER || 'user',
//     password: process.env.PG_PASSWORD || 'password',
//     database: process.env.PG_DATABASE || 'reservas'
// });

// pgClient.connect()
//     .then(() => console.log('Conectado ao PostgreSQL'))
//     .catch(err => console.error('Erro ao conectar ao PostgreSQL', err));

// Inscrever-se no canal de reservas canceladas
subscriber.subscribe('reservas_canceladas', (err, count) => {
    if (err) {
        console.error('Erro ao se inscrever no canal de cancelamentos:', err);
    } else {
        console.log(`Agora escutando ${count} canais de cancelamentos.`);
    }
});

// Handler para reservas canceladas
subscriber.on('message', async (channel, message) => {
    console.log(`Notificacao de aviso de reserva recebida: ${message}`);
    // Processa a fila de respera
    await processRetry(message);
});

// Função para processar a fila de espera
const processRetry = async (message) => {
    const [_, eventoId, userId, timestamp, quantidade] = message.split(':');
    // Processar a fila de espera para o evento
    await processWaitingList(eventoId, userId, quantidade);
};

// Função para processar a fila de espera
const processWaitingList = async (eventoId, userId, quantidade) => {
    try {
        await redisClient.lpush(`fila_espera:${eventoId}`, JSON.stringify({ userId, quantidade }));
        const message = `reserva_solicitada:${eventoId}:${userId}:${""}:${quantidade}`;
        await redisClient.publish('reservas_solicitadas', message);

        console.log("Reserva salva em ordem na fila de reservas!")
  
    } catch (error) {
        console.error('Erro ao tentar incluir a reserva na fila de reservas!:', err);
    }
};



// Inicia o worker
const startWorker = () => {
    // Outros processos de inicialização, se necessário
};

startWorker();










// OPÇÃO USANDO STREAMS


// const Redis = require('ioredis');
// const { Client } = require('pg');  // Importando o cliente PostgreSQL

// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || 'redis',
//   port: process.env.REDIS_PORT || 6379
// });

// // Verifica se o grupo de consumidores já existe e cria se necessário
// async function ensureConsumerGroup() {
//   try {
//     await redisClient.xgroup('CREATE', 'reservas_stream', 'reservas_consumer_group', '0', 'MKSTREAM');
//   } catch (error) {
//     if (!error.message.includes('BUSYGROUP')) {
//       console.error('Erro ao criar grupo de consumidores:', error);
//     }
//   }
// }

// // Função para processar mensagens do stream
// async function processStreamMessages() {
//   try {
//     const result = await redisClient.xreadgroup(
//       'GROUP', 'reservas_consumer_group', 'reservas_worker',
//       'BLOCK', 0,               // Bloqueia até novas mensagens chegarem
//       'COUNT', 10,              // Limita o processamento a 10 mensagens por vez
//       'STREAMS', 'reservas_stream', '>'
//     );

//     if (result) {
//       for (const [stream, messages] of result) {
//         for (const [id, fields] of messages) {
//           const data = {};
//           for (let i = 0; i < fields.length; i += 2) {
//             data[fields[i]] = fields[i + 1];
//           }

//           const { eventoId, userId, quantidade } = data;
//           await processWaitingList(eventoId, userId, quantidade);

//           // Marca a mensagem como processada
//           await redisClient.xack('reservas_stream', 'reservas_consumer_group', id);
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Erro ao processar mensagens do stream:', error);
//   }
// }

// // Função para processar a reserva
// async function processWaitingList(eventoId, userId, quantidade) {
//   const waitingListKey = `fila_espera:${eventoId}`;
//   const transaction = redisClient.multi();
  
//   transaction.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
//   const results = await transaction.exec();
//   const ingressosRestantes = results[0];

//   if (ingressosRestantes[1] >= 0) {
//     const timestamp = Date.now();
//     const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
//     const pipeline = redisClient.pipeline();
//     pipeline.hset(reservationKey, 'dummy', '');
//     pipeline.expire(reservationKey, 600);
//     await pipeline.exec();

//     console.log(`Reserva realizada para o usuário ${userId} do evento ${eventoId} com ${quantidade} ingressos.`);
//   } else {
//     const revertTransaction = redisClient.multi();
//     revertTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
//     await revertTransaction.exec();

//     console.log(`Ingressos insuficientes para o usuário ${userId} - reserva devolvida à fila.`);
//   }
// }

// // Função para iniciar o worker e garantir o grupo de consumidores
// async function startWorker() {
//   await ensureConsumerGroup();

//   while (true) {
//     await processStreamMessages();
//   }
// }

// startWorker();















// versao possível worker retry


// const Redis = require('ioredis');
// const { Client } = require('pg');  // Importando o cliente PostgreSQL

// const redisClient = new Redis({
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379
// });

// const subscriber = new Redis({
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379
// });

// redisClient.on('connect', () => console.log('Worker de Fila de Espera Conectado ao Redis'));
// subscriber.on('connect', () => {
//     console.log('Worker de Fila de Espera Conectado ao Redis');
// });

// // // Conexão com o PostgreSQL
// // const pgClient = new Client({
// //     host: process.env.PG_HOST || 'postgres',
// //     port: process.env.PG_PORT || 5432,
// //     user: process.env.PG_USER || 'user',
// //     password: process.env.PG_PASSWORD || 'password',
// //     database: process.env.PG_DATABASE || 'reservas'
// // });

// // pgClient.connect()
// //     .then(() => console.log('Conectado ao PostgreSQL'))
// //     .catch(err => console.error('Erro ao conectar ao PostgreSQL', err));

// // Inscrever-se no canal de reservas canceladas
// subscriber.subscribe('reservas_canceladas', (err, count) => {
//     if (err) {
//         console.error('Erro ao se inscrever no canal de cancelamentos:', err);
//     } else {
//         console.log(`Agora escutando ${count} canais de cancelamentos.`);
//     }
// });

// // Handler para reservas canceladas
// subscriber.on('message', async (channel, message) => {
//     console.log(`Notificacao para reserva recebida: ${message}`);
//     // Processa a fila de respera
//     await processRetry(message);
// });

// // Função para processar a fila de espera
// const processRetry = async (message) => {
//     const [_, eventoId, userId, timestamp, quantidade] = message.split(':');
//     // Processar a fila de espera para o evento
//     await processWaitingList(eventoId);
// };

// // Função para processar a fila de espera
// const processWaitingList = async (eventoId) => {
//     const waitingListKey = `fila_espera:${eventoId}`;

//     // Verifica se há tentativas de reserva na fila
//     const waitingRequest = await redisClient.rpop(waitingListKey);
//     if (waitingRequest) {
//         const { userId, quantidade } = JSON.parse(waitingRequest);

//         // Iniciar transação
//         const transaction = redisClient.multi();

//         // Decrementa os ingressos disponíveis
//         transaction.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
        
//         // Executa a transação
//         const results = await transaction.exec();
//         const ingressosRestantes = results[0];

//         if (ingressosRestantes[1]  >= 0) {
//             // Se ingressos foram suficientes, conclui a reserva
//             const timestamp = Date.now();
//             const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;

//             // Pipelining Redis operations
//             const pipeline = redisClient.pipeline();
//             pipeline.hset(reservationKey, 'dummy', '');
//             pipeline.expire(reservationKey, 600);
//             await pipeline.exec();

//             // // Salvar a reserva no banco de dados
//             // await pgClient.query(
//             //     'INSERT INTO reservas(evento_id, user_id, quantidade, timestamp, pagamento_efetuado) VALUES ($1, $2, $3, $4, $5)',
//             //     [eventoId, userId, quantidade, timestamp, 0]
//             // );

//             console.log(`Reserva realizada para o usuário ${userId} do evento ${eventoId} com ${quantidade} ingressos.`);
//         } else {
//             // Caso quantidade de ingressos seja insuficiente, iniciar nova transação para reverter
//             const revertTransaction = redisClient.multi();
//             revertTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
//             revertTransaction.rpush(waitingListKey, waitingRequest);
//             await revertTransaction.exec();

//             console.log(`Ingressos insuficientes para o usuário ${userId} - reserva devolvida à fila.`);
//             // Reinsere a tentativa de reserva na fila
//         }
//     } else {
//         console.log('Fila de espera vazia, nenhuma tentativa de reserva a processar.');
//     }
// };



// // Inicia o worker
// const startWorker = () => {
//     // Outros processos de inicialização, se necessário
// };

// startWorker();

