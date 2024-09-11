const net = require('net');

// Configurações do cliente
const HOST = '127.0.0.1';  // Endereço IP do balanceador de carga
const PORT = 65431;        // Porta usada pelo balanceador

// Cria um socket TCP/IP
const client = new net.Socket();

// Conecta ao servidor
client.connect(PORT, HOST, () => {
    console.log('Conectado ao servidor, aguardando acesso ao servico');
    client.write('Hello');  // Envia uma mensagem ao servidor
});

// Recebe dados do servidor
client.on('data', (data) => {
    console.log('Resposta:', data.toString());
    client.destroy();  // Fecha a conexão após receber a resposta
});

// Lida com erros
client.on('error', (err) => {
    console.error('Erro:', err.message);
});

// Lida com o fechamento da conexão
client.on('close', () => {
    console.log('Conexão fechada');
});
