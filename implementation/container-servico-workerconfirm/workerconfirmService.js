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

redisClient.on('connect', () => console.log('Worker de Confirmação Conectado ao Redis'));
subscriber.on('connect', () => {
    console.log('Worker de Confirmação Conectado ao Redis');
});

// Conexão com o PostgreSQL
const pgClient = new Client({
    host: process.env.PG_HOST || 'postgres',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'user',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'reservas'
});

pgClient.connect()
    .then(() => console.log('Conectado ao PostgreSQL'))
    .catch(err => console.error('Erro ao conectar ao PostgreSQL', err));

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
    
    // Remove a reserva do banco de dados
    await removeReservationFromDatabase(reservationKey);
};

// Função para remover a reserva do banco de dados
const removeReservationFromDatabase = async (reservationKey) => {
    const [eventoId, userId, timestamp, quantidade] = reservationKey.split(':').slice(1); // Extraindo os valores

    try {
        const query = 'DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3';
        const values = [eventoId, userId, timestamp];

        const res = await pgClient.query(query, values);
        console.log(`Reserva removida do banco de dados: ${res.rowCount} linha(s) afetada(s)`);
    } catch (err) {
        console.error('Erro ao remover reserva do banco de dados:', err);
    }
};

// Inicia o worker
const startWorker = () => {
    // Outros processos de inicialização, se necessário
};

startWorker();
