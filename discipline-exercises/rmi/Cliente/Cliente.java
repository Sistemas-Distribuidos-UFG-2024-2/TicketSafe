import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

public class Cliente {
    public static void main(String[] args) {
        try {
            // Localiza o registro RMI
            Registry registry = LocateRegistry.getRegistry("localhost", 1099);
            // Obtém o serviço remoto
            MaioridadeService service = (MaioridadeService) registry.lookup("MaioridadeService");
            
            // Dados da pessoa
            String nome = "Rodrigo";
            String sexo = "masculino";
            int idade = 19;
            
            // Chama o método remoto
            String resultado = service.verificarMaioridade(nome, sexo, idade);
            System.out.println("Resultado: " + resultado);
        } catch (Exception e) {
            System.err.println("Erro no cliente: " + e.toString());
            e.printStackTrace();
        }
    }
}
