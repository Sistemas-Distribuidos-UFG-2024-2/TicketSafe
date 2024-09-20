import socket
import threading

class Server:
    def __init__(self, name, host='127.0.0.1', port=54321, discovery_host='127.0.0.1', discovery_port=12345):
        self.name = name
        self.host = host
        self.port = port
        self.discovery_host = discovery_host
        self.discovery_port = discovery_port

    def start(self):
        # Registrar este servidor no Discovery Server
        self.register_with_discovery_server()

        # Iniciar o servidor para aceitar clientes
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((self.host, self.port))
            s.listen()
            print(f"Servidor '{self.name}' rodando em {self.host}:{self.port}")
            
            while True:
                conn, addr = s.accept()
                threading.Thread(target=self.handle_client, args=(conn, addr)).start()

    def register_with_discovery_server(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((self.discovery_host, self.discovery_port))
            # Registrar no formato correto: NOME:HOST:PORTA
            registration_message = f"REGISTER:{self.name}:{self.host}:{self.port}"
            s.sendall(registration_message.encode('utf-8'))
            response = s.recv(1024).decode('utf-8')
            print(f"Resposta do Discovery Server: {response}")

    def handle_client(self, conn, addr):
        with conn:
            print(f"Conexão de {addr}")
            conn.sendall(f"Bem-vindo ao servidor {self.name}".encode('utf-8'))

# Iniciando o servidor
if __name__ == "__main__":
    server = Server(name="Servidor1", host="127.0.0.1", port=54321)
    server.start()

