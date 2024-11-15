const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Worker Save Reserve conectado ao Redis'));

const streamKey = 'reservas_pendentes';
const groupName = 'save_reserve_group';
const consumerName = process.env.CONSUMER_ID;

const script = `
-- Verifica e realiza claim de mensagens seguras para processamento

local eventoKey = KEYS[1]
local lockKey = KEYS[2]
local quantidade = tonumber(ARGV[1])
local reservationKey = ARGV[2]
local expireTime = tonumber(ARGV[3])
local waitingListKey = KEYS[3]
local waitingRequest = ARGV[4]
local streamKey = KEYS[4]
local idRequest = ARGV[5]
local groupName = ARGV[6]

-- Verifica a disponibilidade de ingressos
local quantidadeDisponivel = tonumber(redis.call('GET', eventoKey))

if quantidadeDisponivel and quantidadeDisponivel >= quantidade then
    -- Decrementa e cria a reserva
    redis.call('DECRBY', eventoKey, quantidade)
    redis.call('HSET', reservationKey, 'pagamento_efetuado', 'false')
    redis.call('EXPIRE', reservationKey, expireTime)

    -- Registra a mensagem como processada
    redis.call('DEL', lockKey)
    redis.call('XACK', streamKey, groupName, idRequest)
    return 1
else
    -- Mensagem em fila de espera
    redis.call('LPUSH', waitingListKey, waitingRequest)
    redis.call('DEL', lockKey)
    redis.call('XACK', streamKey, groupName, idRequest)
    return 0
end
`;

async function processStreamRequests(eventoId, userId, quantidade, idRequest, lockKey) {
    const timestamp = Date.now();
    const reservationKey = `reserva:${eventoId}:${userId}:${timestamp}:${quantidade}`;
    const waitingListKey = `fila_espera:${eventoId}`;
    const waitingRequest = JSON.stringify({ userId, quantidade });


    try {
        const result = await redisClient.eval(script, 4,
            `evento:${eventoId}:ingressosDisponiveis`,
            lockKey,
            waitingListKey,
            streamKey,
            quantidade,
            reservationKey,
            600,
            waitingRequest,
            idRequest,
            groupName
        );

        if (result === 1) {
            console.log(`Reserva realizada para o usuário ${userId} do evento ${eventoId} com ${quantidade} ingressos.`);
            // Notificar usuário que sua reserva foi realizada e ele tem 10 minutos para efetuar o pagamento.
        } else if (result === 0) {
            console.log(`Ingressos insuficientes. Reserva adicionada à fila de espera.`);
        }
    } catch (error) {
        console.error('Erro ao tentar incluir solicitação de reserva:', error);
        console.log(`Falha ao tentar reservar o ingresso, tente novamente mais tarde!`);
    }
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callProcessStream(idRequest, fields, lockKey) {
    const eventoId = fields[fields.indexOf('eventoId') + 1];
    const userId = fields[fields.indexOf('userId') + 1];
    const quantidade = fields[fields.indexOf('quantidade') + 1];
    await processStreamRequests(eventoId, userId, quantidade, idRequest, lockKey);
}
const lockTTL = 300; // Expiração do lock em segundos - 5 minutos

const listenToStream = async () => {
    try {
        try {
            await redisClient.xgroup('CREATE', streamKey, groupName, '0', 'MKSTREAM');
            console.log(`Grupo de consumidores '${groupName}' criado no stream '${streamKey}'.`);
        } catch (err) {
            if (!err.message.includes('BUSYGROUP')) {
                console.error('Erro ao criar o grupo de consumidores:', err);
            }
        }
        let messagesClaimed = true;

        while (messagesClaimed) {
            const autoclaimResult = await redisClient.xautoclaim(
                streamKey, groupName, consumerName, 43200000, '0-0', 'COUNT', 1
            );

            const [, claimedMessages] = autoclaimResult || [];
            messagesClaimed = claimedMessages && claimedMessages.length > 0;

            if (messagesClaimed) {
                for (const [idRequest, fields] of claimedMessages) {
                    const lockKey = `lock:${idRequest}`;
                    //lock distribuido
                    const lockAcquired = await redisClient.set(lockKey, idRequest, 'NX', 'EX', lockTTL); //NX - só define a chave se nao existir, EX - tempo de expiração da chave

                    if (lockAcquired) {
                        await callProcessStream(idRequest, fields, lockKey);
                    } else {
                        console.log(`O item ${idRequest} já está sendo processado.`);
                    }
                }
            } else {
                console.log("Sem mensagens a recuperar, prosseguindo para leitura de novas mensagens!")
            }
        }
        while (true){
            const result = await redisClient.xreadgroup(
                'GROUP', groupName, consumerName,
                'COUNT', 1,
                'BLOCK', 5000, // Bloqueia por até 5 segundos aguardando novas mensagens, prossegue assim que uma mensagem chega pra ele
                'STREAMS', streamKey, '>'
            );
            if (result && result.length > 0) {
                for (const [stream, messages] of result) {
                    for (const [idRequest, fields] of messages) {
                        const lockKey = `lock:${idRequest}`;

                        const lockAcquired = await redisClient.set(lockKey, idRequest, 'NX', 'EX', lockTTL);
    
                        if (lockAcquired) {
                            await callProcessStream(idRequest, fields, lockKey);
                        } else {
                            console.log(`O item ${idRequest} já está sendo processado.`);
                        }
                    }
                }
            } else {
                await sleep(1000); // Espera 1 segundo antes de tentar novamente
            }
        }
    } catch (error) {
        console.error('Erro ao ouvir o stream:', error);
    }
};

const startWorker = () => {
    listenToStream();
    console.log('Worker iniciado e ouvindo o stream de reservas canceladas.');
};

startWorker();
