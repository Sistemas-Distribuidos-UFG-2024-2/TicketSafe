import socket
import threading
import random

SERVIDORES_ATIVOS = []  # Armazena a lista de servidores ativos
lock = threading.Lock()  # Cria um lock para controlar o acesso à lista

def atualizar_servidores_ativos():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        HOST = '127.0.0.1'
        PORT = 65429
        s.bind((HOST, PORT))  # Porta para receber a lista de servidores ativos
        s.listen()
        print(f"Balanceador ouvindo atualizacoes de servidores ativos em {HOST}:{PORT}")
        while True:
            conn, addr = s.accept()
            with conn:
                data = conn.recv(1024)
                if data:
                    servidores_str = data.decode('utf-8').strip()
                    
                    # Atualiza a lista de servidores ativos com proteção de lock
                    with lock:
                        SERVIDORES_ATIVOS[:] = []  # Esvazia a lista atual
                        if servidores_str !='NO-SERVERS':
                            for srv in servidores_str.split(','):
                                try:
                                    ip, port = srv.split(':')
                                    SERVIDORES_ATIVOS.append((ip, int(port)))
                                except ValueError:
                                    print(f"Erro ao processar o servidor: {srv}")
                    print(f"[BALANCEADOR] -  Servidores ativos atualizados: {SERVIDORES_ATIVOS}")

def handle_client(conn, addr):
    conn.settimeout(5)  # Define um tempo limite de 5 segundos
    with conn:
        print(f"Conectado por {addr}")
        try:
            data = conn.recv(1024)  # Recebe os dados do cliente

            if not data:
                conn.sendall(b"Sem dados recebidos do cliente.")
                return  # Encerra a conexão se não houver dados

            with lock:
                if SERVIDORES_ATIVOS:
                    # Pega um servidor ativo aleatoriamente da lista
                    servidor = random.choice(SERVIDORES_ATIVOS)
                else:
                    servidor = None

            if servidor:
                try:
                    # Estabelece conexão com o servidor ativo (IP e porta)
                    ip_servidor, porta_servidor = servidor  # Desempacota o IP e a porta do servidor
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as proxy:
                        proxy.connect((ip_servidor, porta_servidor))
                        print(f"Conexão bem sucedida com o servidor {ip_servidor}:{porta_servidor}")
                        
                        proxy.sendall(data)  # Envia os dados do cliente para o servidor

                        # Recebe a resposta do servidor
                        response = proxy.recv(1024)
                        conn.sendall(response)  # Envia a resposta de volta ao cliente
                except Exception as e:
                    print(f"Falha ao acessar o servidor {ip_servidor}:{porta_servidor}: {e}")
                    conn.sendall(b"Erro ao acessar o servidor. Tente novamente.")
            else:
                # Caso não haja servidores ativos
                conn.sendall(b"Nenhum servidor ativo disponivel.")
                print("Nenhum servidor ativo disponível.")
        except socket.timeout:
            print("Tempo limite atingido esperando dados do cliente")
            conn.sendall(b"Tempo limite atingido esperando dados do cliente.")

def balancear_requisicoes():
    HOST = '127.0.0.1'
    PORT = 65430  # Porta onde o balanceador escutará as requisições dos clientes

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen()
        print(f"Balanceador ouvindo requisicoes de clientes em {HOST}:{PORT}")

        while True:
            conn, addr = s.accept()
            # Para cada cliente, inicia uma nova thread para tratar a conexão
            threading.Thread(target=handle_client, args=(conn, addr)).start()

if __name__ == "__main__":
    threading.Thread(target=atualizar_servidores_ativos, daemon=True).start()
    balancear_requisicoes()
