using System;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Aposentadoria;

class Program
{
    static async Task Main(string[] args)
    {
        using var channel = GrpcChannel.ForAddress("http://localhost:50051");

        var client = new AposentadoriaService.AposentadoriaServiceClient(channel);

        while (true)
        {
            Console.WriteLine("Digite a idade do funcionário: ");
            int idade = int.Parse(Console.ReadLine());

            Console.WriteLine("Digite o tempo de serviço do funcionário: ");
            int tempoServico = int.Parse(Console.ReadLine());

            var request = new AposentadoriaRequest
            {
                Idade = idade,
                TempoServico = tempoServico
            };

            var response = await client.VerificarAposentadoriaAsync(request);

            Console.WriteLine($"Resultado: {response.Mensagem}");
            Console.WriteLine("\nPara finalizar use ctrl + C");
        }

    }
}
