import socket
import threading

class DiscoveryServer:
    def __init__(self, host='127.0.0.1', port=12345):
        self.host = host
        self.port = port
        self.servers = []  # Lista para armazenar servidores registrados

    def start(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((self.host, self.port))
            s.listen()
            print(f"Discovery Server rodando em {self.host}:{self.port}")
            
            while True:
                conn, addr = s.accept()
                threading.Thread(target=self.handle_client, args=(conn, addr)).start()

    def handle_client(self, conn, addr):
        with conn:
            print(f"Conexão de {addr}")
            request = conn.recv(1024).decode('utf-8')

            if request.startswith("REGISTER"):
                # Um servidor está se registrando no formato correto NOME:HOST:PORTA
                server_info = request.split(":")[1:]  # Captura o nome, host e porta
                if len(server_info) == 3:  # Verifica se recebeu 3 partes
                    server_entry = ":".join(server_info)
                    self.servers.append(server_entry)
                    conn.sendall(b"Servidor registrado com sucesso")
                else:
                    conn.sendall(b"Erro no formato de registro. Use: NOME:HOST:PORTA")
            elif request == "GET_SERVERS":
                # Um cliente está pedindo a lista de servidores
                if self.servers:
                    response = "\n".join(self.servers).encode('utf-8')
                else:
                    response = "Nenhum servidor disponível"
                conn.sendall(response)

# Iniciando o Discovery Server
if __name__ == "__main__":
    discovery_server = DiscoveryServer()
    discovery_server.start()

