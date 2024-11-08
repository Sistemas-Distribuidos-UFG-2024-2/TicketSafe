const express = require('express');
const Redis = require('ioredis');
const { Client } = require('pg');
const bcrypt = require('bcryptjs'); // Altere de bcrypt para bcryptjs
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
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

// Endpoint para cadastrar um novo usuário
app.post('/usuarios/cadastrar', async (req, res) => {
  const { username, password } = req.body; // Remove o UUID do corpo da requisição

  if (!username || !password) {
    return res.status(400).send({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    // Verifica se o usuário já existe
    const existingUser = await pgClient.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).send({ message: 'Usuário já cadastrado' });
    }

    // Faz hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4(); // Gera um UUID para o novo usuário

    // Insere o novo usuário no PostgreSQL
    await pgClient.query(
      'INSERT INTO usuarios(username, password, uuid) VALUES ($1, $2, $3)',
      [username, hashedPassword, userId]
    );

    res.status(201).send({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).send('Erro ao cadastrar usuário');
  }
});

// Endpoint para login do usuário
app.post('/usuarios/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    // Busca o usuário no banco de dados
    const user = await pgClient.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(400).send({ message: 'Usuário ou senha inválidos' });
    }

    // Verifica a senha
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).send({ message: 'Usuário ou senha inválidos' });
    }

    // Cria um token JWT
    const token = jwt.sign({ userId: user.rows[0].uuid }, process.env.JWT_SECRET, { expiresIn: '12h' });

    // Retorna o token e o UUID do usuário
    res.status(200).send({ message: 'Login bem-sucedido', token, uuid: user.rows[0].uuid });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).send('Erro ao fazer login');
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de autenticação rodando na porta ${PORT}`);
});
