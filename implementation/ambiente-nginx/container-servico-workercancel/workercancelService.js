const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

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

    // Iniciar uma transação no Redis - semelhante ao script LUA 
    const transaction = redisClient.multi();

    // Incrementa a quantidade de ingressos disponíveis no evento
    transaction.incrby(`evento:${eventoId}:ingressosDisponiveis`, quantidade);
    console.log(`Quantidade de ingressos a ser atualizada para o evento ${eventoId}: +${quantidade}`);

    // Publica uma notificação para cada quantidade de ingressos
    // possibilitando que varios usuarios que estejam esperando na fila de espera sejam atendidos 
    for (let i = 0; i < quantidade; i++) {
        const message = `reserva_cancelada:${eventoId}:${userId}:${timestamp}:${quantidade}`;
        transaction.publish('reservas_solicitadas', message);
      }
      
    // Executa a transação no Redis
    await transaction.exec();
};

// Inicia o worker
const startWorker = () => {
    // Você pode iniciar outros processos aqui se necessário
};

startWorker();
