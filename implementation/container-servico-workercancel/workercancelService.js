const Redis = require('ioredis');
const { Client } = require('pg'); // Importa o cliente do PostgreSQL

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379
});

// // Configurações do PostgreSQL
// const pgClient = new Client({
//     host: process.env.PG_HOST || 'postgres',
//     port: process.env.PG_PORT || 5432,
//     user: process.env.PG_USER || 'user', // Substitua pelo seu usuário
//     password: process.env.PG_PASSWORD || 'password', // Substitua pela sua senha
//     database: process.env.PG_DATABASE || 'reservas' // Substitua pelo seu banco de dados
// });

// pgClient.connect()
//     .then(() => console.log('Conectado ao PostgreSQL'))
//     .catch(err => console.error('Erro ao conectar ao PostgreSQL', err));

// Conectar ao Redis
redisClient.on('connect', () => console.log('Worker de Cancelamento Conectado ao Redis'));

// Conectar o subscriber ao Redis e inscrever-se no canal
subscriber.on('connect', () => {
    console.log('Subscriber conectado ao Redis');
    subscriber.psubscribe('__keyevent@0__:expired', (err, count) => {
        if (err) {
            console.error('Erro ao se inscrever no canal de expiração:', err);
        } else {
            console.log(`Agora escutando ${count} canais de expiração.`);
        }
    });
});

// Handler para chaves expiradas
subscriber.on('pmessage', async (pattern, channel, reservationKey) => {
    console.log(`Chave expirada: ${reservationKey}`);
    
    // Chave expirada representa a reserva que deve ser cancelada
    await processExpiredReservation(reservationKey);
});

// Função para processar a reserva expirada
const processExpiredReservation = async (reservationKey) => {
    const [_, eventoId, userId, timestamp, quantidade] = reservationKey.split(':');

    // Iniciar uma transação no Redis
    const transaction = redisClient.multi();

    // Incrementa a quantidade de ingressos disponíveis no evento
    transaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
    console.log(`Quantidade de ingressos a ser atualizada para o evento ${eventoId}: +${quantidade}`);

    // Publica uma notificação no canal de reservas canceladas
    const message = `reserva_cancelada:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    transaction.publish('reservas_canceladas', message);

    // Executa a transação no Redis
    await transaction.exec();

    // Remove a reserva do banco de dados PostgreSQL
    // await pgClient.query('DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3', [eventoId, userId, timestamp]);
    // console.log(`Reserva removida do PostgreSQL para o evento ${eventoId} e usuário ${userId}`);
};



// Inicia o worker
const startWorker = () => {
    // Você pode iniciar outros processos aqui se necessário
};

startWorker();
