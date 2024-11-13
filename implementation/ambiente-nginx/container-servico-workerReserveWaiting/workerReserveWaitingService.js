
const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Worker para processamento de reservas Conectado ao Redis'));
subscriber.on('connect', () => {
    console.log('Worker para processamento de reservas Conectado ao Redis');
});

// Script Lua para tentar processar a reserva
const script = `
-- Lua script para processar uma tentativa de reserva de ingressos
local waitingListKey = KEYS[1]            -- Fila de espera do evento
local availableTicketsKey = KEYS[2]       -- Chave para os ingressos disponíveis
local eventId = KEYS[3]                   -- ID do evento

-- RPOP da fila de espera
local request = redis.call('RPOP', waitingListKey)

if request then
    -- Se há uma solicitação na fila, processa
    local requestData = cjson.decode(request)  -- Decodifica o JSON da requisição
    local userId = requestData.userId         -- ID do usuário
    local requestedQuantity = tonumber(requestData.quantidade)  -- Converte para número

    -- Verifica a quantidade de ingressos disponíveis
    local currentTickets = tonumber(redis.call('GET', availableTicketsKey))

    if currentTickets >= requestedQuantity then
        -- Se há ingressos suficientes, realiza a reserva
        redis.call('DECRBY', availableTicketsKey, requestedQuantity)

        -- Cria a chave para a reserva com um timestamp único
        local timestamp = tostring(redis.call('TIME')[1])  -- Obtém o timestamp atual
        local reservationKey = 'reserva:' .. eventId .. ':' .. userId .. ':' .. timestamp .. ':' .. requestedQuantity

        -- Salva a reserva no Redis
        redis.call('HSET', reservationKey, 'dummy', '')
        redis.call('EXPIRE', reservationKey, 600)  -- Expira em 10 minutos

        -- Retorna sucesso
        return {1, reservationKey}  -- Sucesso, retorna a chave da reserva

    else
        -- Se ingressos insuficientes, reintegra a tentativa de reserva à fila
        redis.call('RPUSH', waitingListKey, request)

        -- Retorna falha
        return {0, "Ingressos insuficientes, tentativa reinserida na fila."}
    end
else
    -- Caso a fila de espera esteja vazia
    return {0, "Fila de espera para esse evento está vazia."}
end
`;

// Handler para reservas canceladas
subscriber.on('message', async (channel, message) => {
    console.log(`Notificacao para processamento de reserva recebida: ${message}`);
    // Processa a fila de respera
    await processRetry(message);
});

// Inscrever-se no canal de reservas canceladas
subscriber.subscribe('reservas_solicitadas', (err, count) => {
    if (err) {
        console.error('Erro ao se inscrever no canal de reservas:', err);
    } else {
        console.log(`Agora escutando ${count} canais de reservas.`);
    }
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
    const availableTicketsKey = `evento:${eventoId}:ingressosDisponiveis`

    try {
        const result = await redisClient.eval(script, 3,
            waitingListKey, 
            availableTicketsKey, 
            eventoId
        );
        if (result[0] === 1) {
            console.log(`Reserva realizada: ${result[1]}`);
        } else {
            console.log(`Erro: ${result[1]}`);
        }
    } catch (error) {
        // Tratar qualquer erro que ocorrer na execução do script Lua
        console.error('Erro ao tentar processar solicitacoes de reserva em espera!:', error);
    }
};

// Inicia o worker
const startWorker = () => {
    // Outros processos de inicialização, se necessário
};

startWorker();

