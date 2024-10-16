import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

public class MaioridadeServer {
    public static void main(String[] args) {
        try {
            // Cria uma instância do serviço
            MaioridadeService service = new MaioridadeServiceImpl();
            
            // Cria o registro RMI na porta padrão 1099
            Registry registry = LocateRegistry.createRegistry(1099);
            // Registra o serviço com o nome "MaioridadeService"
            registry.rebind("MaioridadeService", service);
            
            System.out.println("Servidor RMI de verificação de maioridade está pronto.");
        } catch (Exception e) {
            System.err.println("Erro no servidor: " + e.toString());
            e.printStackTrace();
        }
    }
}
