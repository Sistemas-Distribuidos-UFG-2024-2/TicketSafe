import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public class MaioridadeServiceImpl extends UnicastRemoteObject implements MaioridadeService {

    protected MaioridadeServiceImpl() throws RemoteException {
        super();
    }

    @Override
    public String verificarMaioridade(String nome, String sexo, int idade) throws RemoteException {
        int maioridade;
        
        if (sexo.equalsIgnoreCase("masculino")) {
            maioridade = 18;
        } else if (sexo.equalsIgnoreCase("feminino")) {
            maioridade = 21;
        } else {
            return "Sexo inválido: " + sexo;
        }
        
        if (idade >= maioridade) {
            return nome + " já atingiu a maioridade.";
        } else {
            return nome + " ainda não atingiu a maioridade.";
        }
    }
}
