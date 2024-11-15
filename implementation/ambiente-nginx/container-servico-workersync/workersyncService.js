const Redis = require('ioredis');
const { Client } = require('pg');

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

async function connectPostgres() {
  await pgClient.connect();
  console.log('Worker conectado ao PostgreSQL');
}

connectPostgres();

// Função de sincronização
async function sincronizarIngressos() {
  try {
    const eventosRedis = await redisClient.keys('evento:*:ingressosDisponiveis');

    for (const chave of eventosRedis) {
      const eventoId = chave.split(':')[1]; // Extrai o ID do evento da chave

      const ingressosDisponiveis = await redisClient.get(chave);
      if (ingressosDisponiveis !== null) {
        await pgClient.query(
          'UPDATE ingressos SET ingressos_disponiveis = $1 WHERE id = $2',
          [parseInt(ingressosDisponiveis), eventoId]
        );
      }

      // // Sincronização da fila de espera
      // await sincronizarFilaEspera(eventoId);

      // // Sincronização das reservas
      // await sincronizarReservas(eventoId);
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// // Função para sincronizar a fila de espera
// async function sincronizarFilaEspera(eventoId) {
//   const filaEsperaRedis = await redisClient.lrange(`fila_espera:${eventoId}`, 0, -1);
//   const filaEsperaBanco = await pgClient.query('SELECT user_id, quantidade FROM fila_espera WHERE evento_id = $1', [eventoId]);

//   const filaEsperaBancoMap = new Map();
//   filaEsperaBanco.rows.forEach(row => {
//     filaEsperaBancoMap.set(row.user_id, row.quantidade);
//   });

//   // Adiciona ou atualiza novos registros ao banco de dados
//   const promises = filaEsperaRedis.map(async item => {
//     const { userId, quantidade } = JSON.parse(item);
//     if (!filaEsperaBancoMap.has(userId)) {
//       return pgClient.query(
//         'INSERT INTO fila_espera (evento_id, user_id, quantidade) VALUES ($1, $2, $3)',
//         [eventoId, userId, quantidade]
//       ).catch(err => console.error(`Erro ao inserir fila de espera: ${err.message}`));
//     } else {
//       const quantidadeExistente = filaEsperaBancoMap.get(userId);
//       if (parseInt(quantidadeExistente) !== parseInt(quantidade)) {
//         return pgClient.query(
//           'UPDATE fila_espera SET quantidade = $1 WHERE evento_id = $2 AND user_id = $3',
//           [quantidade, eventoId, userId]
//         ).catch(err => console.error(`Erro ao atualizar fila de espera: ${err.message}`));
//       }
//       filaEsperaBancoMap.delete(userId);
//     }
//   });

//   await Promise.all(promises);

//   const deletePromises = [...filaEsperaBancoMap.keys()].map(userId => {
//     return pgClient.query(
//       'DELETE FROM fila_espera WHERE evento_id = $1 AND user_id = $2',
//       [eventoId, userId]
//     ).catch(err => console.error(`Erro ao deletar fila de espera: ${err.message}`));
//   });

//   await Promise.all(deletePromises);
// }

// // Função para sincronizar as reservas
// async function sincronizarReservas(eventoId) {
//   const reservasRedis = await redisClient.keys(`reserva:${eventoId}:*`); // Obtém todas as chaves de reservas para o evento

//   const reservasBanco = await pgClient.query('SELECT user_id, quantidade, timestamp FROM reservas WHERE evento_id = $1', [eventoId]);

//   const reservasBancoMap = new Map();
//   reservasBanco.rows.forEach(row => {
//     const key = `${row.user_id}:${row.timestamp}`; // Cria uma chave única com userId e timestamp
//     reservasBancoMap.set(key, row.quantidade);
//   });

//   // Adiciona ou atualiza reservas
//   const promises = reservasRedis.map(async chave => {
//     const [_, evento_id, userId, timestamp,quantidade] = chave.split(':'); // Extrai os dados da chave
//     const key = `${userId}:${timestamp}`;

//     if (!reservasBancoMap.has(key)) {
//       return pgClient.query(
//         'INSERT INTO reservas(evento_id, user_id, quantidade, timestamp, pagamento_efetuado) VALUES ($1, $2, $3, $4, $5)',
//         [eventoId, userId, parseInt(quantidade), timestamp, 0]
//       ).catch(err => console.error(`Erro ao inserir reserva: ${err.message}`));
//     } else {
//       const quantidadeExistente = reservasBancoMap.get(key);
//       if (parseInt(quantidadeExistente) !== parseInt(quantidade)) {
//         return pgClient.query(
//           'UPDATE reservas SET quantidade = $1 WHERE evento_id = $2 AND user_id = $3 AND timestamp = $4',
//           [quantidade, eventoId, userId, timestamp]
//         ).catch(err => console.error(`Erro ao atualizar reserva: ${err.message}`));
//       }
//       reservasBancoMap.delete(key);
//     }
//   });

//   await Promise.all(promises);

//   // Remove registros que não estão mais no Redis
//   const deletePromises = [...reservasBancoMap.keys()].map(key => {
//     const [userId, timestamp] = key.split(':');
//     return pgClient.query(
//       'DELETE FROM reservas WHERE evento_id = $1 AND user_id = $2 AND timestamp = $3',
//       [eventoId, userId, timestamp]
//     ).catch(err => console.error(`Erro ao deletar reserva: ${err.message}`));
//   });

//   await Promise.all(deletePromises);
// }

async function iniciarSincronizacao() {
  await sincronizarIngressos();
  setTimeout(iniciarSincronizacao, 15000);
}

iniciarSincronizacao();
