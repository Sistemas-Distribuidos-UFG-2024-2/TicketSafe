const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg');
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('connect', () => console.log('Conectado ao Redis'));

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
  console.log('Conectado ao PostgreSQL');
}

connectPostgres();

// Endpoint para cadastrar um novo evento
app.post('/eventos/cadastrar', async (req, res) => {
  const { nome, ingressosDisponiveis } = req.body;

  if (!nome || ingressosDisponiveis === undefined) {
    return res.status(400).send({ message: 'Nome do evento e ingressos disponíveis são obrigatórios' });
  }

  try {
    // Insere o evento na tabela ingressos e retorna o ID gerado
    const result = await pgClient.query(
      'INSERT INTO ingressos (nome, ingressos_disponiveis) VALUES ($1, $2) RETURNING id',
      [nome, ingressosDisponiveis]
    );
    const id = result.rows[0].id;

    const pipeline = redisClient.pipeline();

    // Armazena o evento no Redis com o id
    pipeline.set(`evento:${id}:ingressosDisponiveis`, ingressosDisponiveis);
    pipeline.set(`evento:${id}:ingressosAlvoLimite`, ingressosDisponiveis);

    // Executa o pipeline e verifica se todas as operações foram bem-sucedidas
    const results = await pipeline.exec();
    const pipelineErrors = results.filter(([error]) => error);

    if (pipelineErrors.length > 0) {
      console.error('Erro ao executar operações no Redis:', pipelineErrors);
      return res.status(500).send({ message: 'Erro ao cadastrar o evento no Redis' });
    }

    res.status(201).send({ message: 'Evento cadastrado com sucesso!', eventoId: id, nome });
  } catch (err) {
    console.error('Erro ao cadastrar o evento:', err);
    res.status(500).send({ message: 'Erro ao cadastrar o evento' });
  }
});


// Endpoint para excluir um evento
app.delete('/eventos/excluir', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send({ message: 'Id do evento é obrigatório' });
  }

  try {
    // Verifica se o evento existe no Redis
    const exists = await redisClient.exists(`evento:${id}:ingressosDisponiveis`);

    if (!exists) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Iniciar transação no Redis
    const transaction = redisClient.multi();
    
    // Remove as chaves do evento do Redis
    transaction.del(`evento:${id}:ingressosDisponiveis`);
    transaction.del(`evento:${id}:ingressosAlvoLimite`);

    // Executa a transação no Redis
    await transaction.exec();

    // Remove o evento da tabela ingressos no PostgreSQL
    await pgClient.query('DELETE FROM ingressos WHERE id = $1', [id]);

    res.status(200).send({ message: 'Evento excluído com sucesso!' });
  } catch (err) {
    console.error('Erro ao excluir o evento:', err);
    res.status(500).send('Erro ao excluir o evento');
  }
});



// Endpoint para atualizar um evento
app.put('/eventos/atualizar', async (req, res) => {
  const { id, ingressosDisponiveis } = req.body;

  if (!id || ingressosDisponiveis === undefined) {
    return res.status(400).send({ message: 'Id do evento e nova quantidade de ingressos disponíveis são obrigatórios' });
  }

  try {
    // Verifica se o evento existe no Redis
    const exists = await redisClient.exists(`evento:${id}:ingressosDisponiveis`);

    if (!exists) {
      return res.status(404).send({ message: 'Evento não encontrado' });
    }

    // Iniciar transação no Redis
    const transaction = redisClient.multi();
    
    // Atualiza o evento no Redis
    transaction.set(`evento:${id}:ingressosDisponiveis`, ingressosDisponiveis);
    
    // Publica uma notificação para cada ingresso disponível
    for (let i = 0; i < ingressosDisponiveis; i++) {
      const message = `ingressos_atualizados:${id}:${""}:${""}:${""}`;
      transaction.publish('reservas_solicitadas', message);
    }
    
    // Executa a transação no Redis
    await transaction.exec();

    // Atualiza o evento na tabela ingressos no PostgreSQL
    await pgClient.query(
      'UPDATE ingressos SET ingressos_disponiveis = $1 WHERE id = $2',
      [ingressosDisponiveis, id]
    );

    res.status(200).send({ message: 'Evento atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar o evento:', err);
    res.status(500).send('Erro ao atualizar o evento');
  }
});

// Endpoint para listar todos os eventos
app.get('/eventos/listar', async (req, res) => {
  try {
    // Recupera todos os eventos da tabela ingressos
    const result = await pgClient.query('SELECT id, ingressos_disponiveis, nome FROM ingressos');
    const eventos = result.rows;

    res.status(200).send(eventos);
  } catch (err) {
    console.error('Erro ao listar eventos:', err);
    res.status(500).send('Erro ao listar eventos');
  }
});

// Função para adquirir o lock distribuído no Redis
async function acquireLock(lockKey, lockTimeout) {
  // Tenta adquirir o lock com um tempo de expiração (ex: 30 segundos)
  const result = await redisClient.set(lockKey, 'locked', 'NX', 'EX', lockTimeout);
  return result === 'OK'; // Se a chave foi criada, o lock foi adquirido
}

async function verificarDisponibilidadeIngressos() {
  const lockKey = 'lock:verificarDisponibilidadeIngressos';
  const lockTimeout = 300; // Tempo de expiração do lock em segundos (5 minutos)

  while (true) {
    // Espera 5 minutos antes de iniciar a próxima execução
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    try {
      // Tenta adquirir o lock
      const lockAcquired = await acquireLock(lockKey, lockTimeout);
      if (!lockAcquired) {
        console.log('Outro worker está processando a disponibilidade de ingressos. Tentando novamente em breve...');
        continue;
      }

      // Usa SCAN para procurar chaves que começam com 'reserva:'
      let cursor = '0';
      let reservasExistentes = [];
      do {
        // SCAN com o prefixo 'reserva:'
        const result = await redisClient.scan(cursor, 'MATCH', 'reserva:*', 'COUNT', 100);
        cursor = result[0];
        reservasExistentes = reservasExistentes.concat(result[1]);
      } while (cursor !== '0' && reservasExistentes.length === 0); // Continua se não tiver encontrado nenhuma chave

      if (reservasExistentes.length > 0) {
        console.log('Existem reservas em andamento no Redis, não será necessário realizar a consulta ao banco.');
        continue; // Se existir pelo menos uma chave de reserva, não faz nada e reinicia o loop
      }

      // Obtenha todos os eventos com ingressos disponíveis
      const eventos = await pgClient.query('SELECT id FROM ingressos');

      for (const evento of eventos.rows) {
        const eventoId = evento.id;

        // Busca o número de reservas confirmadas no PostgreSQL
        const reservasConfirmadasRes = await pgClient.query(
          'SELECT COUNT(*) AS total FROM reservas WHERE pagamento_efetuado = TRUE AND evento_id = $1',
          [eventoId]
        );
        const reservasConfirmadas = parseInt(reservasConfirmadasRes.rows[0].total, 10);

        // Busca ingressos disponíveis e limite de ingressos do evento no Redis
        const [ingressosDisponiveis, ingressosAlvoLimite] = await redisClient.mget(
          `evento:${eventoId}:ingressosDisponiveis`,
          `evento:${eventoId}:ingressosAlvoLimite`
        );

        const ingressosDisponiveisAtual = parseInt(ingressosDisponiveis || '0', 10);
        const ingressosAlvoLimiteAtual = parseInt(ingressosAlvoLimite || '0', 10);

        // Verifica o tamanho inicial da fila de espera
        const tamanhoFilaEsperaInicial = await redisClient.llen(`fila_espera:${eventoId}`);

        // Espera 5 segundos para verificar novamente o tamanho da fila de espera
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verifica o tamanho da fila de espera novamente
        const tamanhoFilaEsperaFinal = await redisClient.llen(`fila_espera:${eventoId}`);

        // Se a fila de espera diminuiu, significa que outro serviço está processando as reservas
        if (tamanhoFilaEsperaFinal < tamanhoFilaEsperaInicial) {
          console.log(`A fila de espera do evento ${eventoId} diminuiu, não é necessário atualizar os ingressos.`);
          continue;
        }

        // Calcula a quantidade de ingressos a liberar, se necessário
        const limiteIngressosLiberados = ingressosAlvoLimiteAtual - reservasConfirmadas;
        const ingressosNecessarios = Math.min(tamanhoFilaEsperaFinal, limiteIngressosLiberados);

        if (ingressosDisponiveisAtual === 0 && ingressosNecessarios > 0) {
          // Adiciona o comando WATCH para a chave de ingressosDisponiveis
          await redisClient.watch(`evento:${eventoId}:ingressosDisponiveis`);
        
          // Iniciar transação no Redis
          const transaction = redisClient.multi();
          
          // Atualiza o evento no Redis
          transaction.set(`evento:${eventoId}:ingressosDisponiveis`, ingressosNecessarios);
        
          // Publica uma notificação para cada ingresso disponível
          for (let i = 0; i < ingressosNecessarios; i++) {
            const message = `ingressos_atualizados:${eventoId}:${""}:${""}:${""}`;
            transaction.publish('reservas_solicitadas', message);
          }
        
          // Executa a transação no Redis
          const result = await transaction.exec();
        
          // Se result for null, isso significa que a chave foi alterada durante a execução da transação
          if (result === null) {
            console.log(`A transação falhou para o evento ${eventoId}. A chave 'ingressosDisponiveis' foi alterada durante a execução.`);
          } else {
            console.log(`Ingressos atualizados para o evento ${eventoId}. Novos ingressos disponíveis: ${ingressosNecessarios}`);
          }
        }
        
      }
    } catch (err) {
      console.error('Erro ao verificar a disponibilidade de ingressos:', err);
    } finally {
      // Libera o lock após o processamento
      await redisClient.del(lockKey);
    }
  }
}

// Inicia a execução da função em loop 
verificarDisponibilidadeIngressos();

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de Eventos rodando na porta ${PORT}`);
});
