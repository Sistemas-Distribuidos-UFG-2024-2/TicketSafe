import socket

class Client:
    def __init__(self, discovery_host='127.0.0.1', discovery_port=12345):
        self.discovery_host = discovery_host
        self.discovery_port = discovery_port

    def discover_servers(self):
        try:
            # Conectar-se ao Discovery Server para obter a lista de servidores
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((self.discovery_host, self.discovery_port))
                s.sendall(b"GET_SERVERS")
                response = s.recv(1024).decode('utf-8')
                
                if not response:
                    print("Nenhuma resposta do Discovery Server.")
                    return []
                
                if response == "Nenhum servidor disponível":
                    print(response)
                    return []
                else:
                    servers = response.split("\n")
                    print("Servidores disponíveis:")
                    for server in servers:
                        print(server)
                    return servers
        except socket.error as e:
            print(f"Erro ao se conectar ao Discovery Server: {e}")
            return []

    def connect_to_server(self, server_info):
        try:
            # Conectar-se ao servidor específico
            server_name, server_host, server_port = server_info.split(":")
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((server_host, int(server_port)))
                response = s.recv(1024).decode('utf-8')
                
                if not response:
                    print(f"Erro: sem resposta do servidor {server_name}")
                else:
                    print(f"Resposta do {server_name}: {response}")
        except socket.error as e:
            print(f"Erro ao se conectar ao servidor {server_name}: {e}")

# Exemplo de uso
if __name__ == "__main__":
    client = Client()

    # Descobrir servidores
    servers = client.discover_servers()

    # Se houver servidores disponíveis, conectar-se ao primeiro
    if servers:
        client.connect_to_server(servers[0])

