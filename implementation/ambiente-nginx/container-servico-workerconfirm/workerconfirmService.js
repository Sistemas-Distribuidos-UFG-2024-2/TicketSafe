const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Worker de Confirmação Conectado ao Redis'));
subscriber.on('connect', () => {
    console.log('Worker de Confirmação Conectado ao Redis');
});


// Inscrever-se no canal de reservas confirmadas
subscriber.subscribe('reservas_confirmadas', (err, count) => {
    if (err) {
        console.error('Erro ao se inscrever no canal de confirmações:', err);
    } else {
        console.log(`Agora escutando ${count} canais de confirmações.`);
    }
});

// Handler para reservas confirmadas
subscriber.on('message', async (channel, message) => {
    console.log(`Reserva confirmada recebida: ${message}`);
    
    // Processa a reserva confirmada
    await processConfirmedReservation(message);
});

// Função para processar reservas confirmadas
const processConfirmedReservation = async (reservationKey) => {
    const [_, eventoId, userId, timestamp, quantidade] = reservationKey.split(':');

    // Aqui você pode realizar operações adicionais,
    // como envio de e-mails de confirmação, emissão de ingressos, etc.
    console.log(`Reserva confirmada para o evento ${eventoId} com ${quantidade} ingressos.`);
    
    // Exemplo: Remove a reserva após confirmação
    await redisClient.del(reservationKey);
    
};

// Inicia o worker
const startWorker = () => {
    // Outros processos de inicialização, se necessário
};

startWorker();
