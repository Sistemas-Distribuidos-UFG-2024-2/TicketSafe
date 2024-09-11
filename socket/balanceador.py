import socket

servicos = [
    ('127.0.0.1', 65432),  # servico 1
    ('127.0.0.1', 65433),  # servico 2
    ('127.0.0.1', 65434),  # servico 3
]

def escolher_servico():
    servico = escolher_servico.index % len(servicos)
    escolher_servico.index += 1
    return servicos[servico]


escolher_servico.index = 0  # Inicializa o índice para o round-robin

HOST = '127.0.0.1'
PORT = 65431  

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    print(f"Balanceador ouvindo em {HOST}:{PORT}")
    while True:
        conn, addr = s.accept()
        conn.settimeout(5) 
        with conn:
            print(f"Conectado por {addr}")
            try:
                data = conn.recv(1024)  # Recebe os dados do cliente

                if not data:
                    break  # Encerra a conexão se não houver dados

                while True:
                    server = escolher_servico()  # escolhe o servico 
                    try:
                        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as proxy:
                            proxy.connect(server)
                            print(f"Conexão bem sucedida!")
                            proxy.sendall(data)  # Envia os dados do cliente para o servidor
                            response = proxy.recv(1024)  # Recebe a resposta do servidor
                            conn.sendall(response)  # Envia a resposta de volta ao cliente
                            break
                    except Exception:
                        print(f"Falha ao acessar um dos serviços, redirecionando")
                        pass
            except socket.timeout:
                print("Tempo limite atingido esperando dados do cliente")
                conn.sendall("Tempo limite atingido esperando dados do cliente".encode())
                pass
