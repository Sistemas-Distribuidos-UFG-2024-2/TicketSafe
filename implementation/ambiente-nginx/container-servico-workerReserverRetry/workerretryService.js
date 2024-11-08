const Redis = require('ioredis');
const { Client } = require('pg');  // Importando o cliente PostgreSQL

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'redis',
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
    console.log(`Notificacao para reserva recebida: ${message}`);
    // Processa a fila de respera
    await processRetry(message);
});

// Função para processar a fila de espera
const processRetry = async (message) => {
    const [_, eventoId, userId, timestamp, quantidade] = message.split(':');
    // Processar a fila de espera para o evento
    await processWaitingList(eventoId);
};

// Função para processar a fila de espera
const processWaitingList = async (eventoId) => {
    const waitingListKey = `fila_espera:${eventoId}`;

    // Verifica se há tentativas de reserva na fila
    const waitingRequest = await redisClient.rpop(waitingListKey);
    if (waitingRequest) {
        const { userId, quantidade } = JSON.parse(waitingRequest);

        // Iniciar transação
        const transaction = redisClient.multi();

        // Decrementa os ingressos disponíveis
        transaction.decrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
        
        // Executa a transação
        const results = await transaction.exec();
        const ingressosRestantes = results[0];

        if (ingressosRestantes[1]  >= 0) {
            // Se ingressos foram suficientes, conclui a reserva
            const timestamp = Date.now();
            const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;

            // Pipelining Redis operations
            const pipeline = redisClient.pipeline();
            pipeline.hset(reservationKey, 'dummy', '');
            pipeline.expire(reservationKey, 600);
            await pipeline.exec();

            // // Salvar a reserva no banco de dados
            // await pgClient.query(
            //     'INSERT INTO reservas(evento_id, user_id, quantidade, timestamp, pagamento_efetuado) VALUES ($1, $2, $3, $4, $5)',
            //     [eventoId, userId, quantidade, timestamp, 0]
            // );

            console.log(`Reserva realizada para o usuário ${userId} do evento ${eventoId} com ${quantidade} ingressos.`);
        } else {
            // Caso quantidade de ingressos seja insuficiente, iniciar nova transação para reverter
            const revertTransaction = redisClient.multi();
            revertTransaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
            revertTransaction.rpush(waitingListKey, waitingRequest);
            await revertTransaction.exec();

            console.log(`Ingressos insuficientes para o usuário ${userId} - reserva devolvida à fila.`);
            // Reinsere a tentativa de reserva na fila
        }
    } else {
        console.log('Fila de espera vazia, nenhuma tentativa de reserva a processar.');
    }
};



// Inicia o worker
const startWorker = () => {
    // Outros processos de inicialização, se necessário
};

startWorker();
