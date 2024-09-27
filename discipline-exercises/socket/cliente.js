const net = require('net');

// Configurações do cliente
const HOST = '127.0.0.1';  // Endereço IP do balanceador de carga
const PORT = 65430;        // Porta usada pelo balanceador para tratar requisições de clientes

// Função para criar um cliente e conectar ao balanceador
function criarCliente(id) {
    // Cria um socket TCP/IP
    const client = new net.Socket();

    // Conecta ao servidor (balanceador)
    client.connect(PORT, HOST, () => {
        console.log(`Cliente ${id} conectado ao servidor, aguardando acesso ao serviço`);
        client.write(`Hello`);  // Envia uma mensagem identificada ao balanceador
    });

    // Recebe dados do servidor
    client.on('data', (data) => {
        console.log(`Resposta recebida pelo Cliente ${id}:`, data.toString());
        client.destroy();  // Fecha a conexão após receber a resposta
    });

    // Lida com erros
    client.on('error', (err) => {
        console.error(`Erro no Cliente ${id}:`, err.message);
    });

    // Lida com o fechamento da conexão
    client.on('close', () => {
    });
}

for (let i = 1; i <= 3; i++) {
    // Usamos setTimeout para garantir que as chamadas sejam feitas quase ao mesmo tempo
    setTimeout(() => {
        criarCliente(i);  // Cria e conecta o cliente i
    }, 0);  // Pode ajustar o delay se necessário
}
