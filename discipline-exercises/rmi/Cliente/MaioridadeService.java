import java.rmi.Remote;
import java.rmi.RemoteException;

public interface MaioridadeService extends Remote {
    String verificarMaioridade(String nome, String sexo, int idade) throws RemoteException;
}
