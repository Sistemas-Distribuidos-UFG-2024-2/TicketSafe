import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.Scanner;

public class Cliente {
    public static void main(String[] args) {
        try {
            // Localiza o registro RMI
            Registry registry = LocateRegistry.getRegistry("localhost", 1099);
            // Obtém o serviço remoto
            MaioridadeService service = (MaioridadeService) registry.lookup("MaioridadeService");
            
            Scanner scanner = new Scanner(System.in);
            while(true){
                
                System.out.println("Digite o nome: ");
                Thread.sleep(500);
                String nome = scanner.nextLine();

                // Lê o sexo (0 para masculino, 1 para feminino)
                System.out.println("Digite o sexo (0 para masculino, 1 para feminino): ");
                Thread.sleep(500);
                int sexoInput = scanner.nextInt();
                String sexo;
                if (sexoInput == 0) {
                    sexo = "masculino";
                } else if (sexoInput == 1) {
                    sexo = "feminino";
                } else {
                    sexo = "nao especificado";
                }

                scanner.nextLine();

                // Lê a idade
                System.out.println("Digite a idade: ");
                Thread.sleep(500);
                int idade = scanner.nextInt();

                scanner.nextLine();
                
                // Chama o método remoto
                // System.out.println("Nome: " + nome);
                // System.out.println("Sexo: " + sexo);
                // System.out.println("Idade: " + idade);
                String resultado = service.verificarMaioridade(nome, sexo, idade);
                System.out.println("Resultado: " + resultado);
            }
        } catch (Exception e) {
            System.err.println("Erro no cliente: " + e.toString());
            e.printStackTrace();
        }
    }
}
