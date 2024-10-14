const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('./aposentadoria.proto', {});
const aposentadoriaProto = grpc.loadPackageDefinition(packageDefinition).aposentadoria;

function verificarAposentadoria(call, callback) {
    const { idade, tempoServico } = call.request;

    let podeAposentar = false;
    let mensagem = "Não pode se aposentar";

    if (idade >= 65 || tempoServico >= 30 || (idade >= 60 && tempoServico >= 25)) {
        podeAposentar = true;
        mensagem = "Pode se aposentar";
    }

    callback(null, { podeAposentar, mensagem });
}

const server = new grpc.Server();
server.addService(aposentadoriaProto.AposentadoriaService.service, { VerificarAposentadoria: verificarAposentadoria });

const address = 'localhost:50051';
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`Servidor gRPC rodando em ${address}`);
    server.start();
});