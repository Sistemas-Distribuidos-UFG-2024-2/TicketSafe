import socket
import threading
import multiprocessing
import time
import random

BUFFER_SIZE = 5

# Buffer compartilhado
buffer = []
mutex = threading.Lock()  # Mutex para sincronização de acesso ao buffer

# Semáforos para controlar o acesso ao buffer
empty = threading.Semaphore(BUFFER_SIZE)  # Quantos itens podem ser produzidos.
full = threading.Semaphore(0)             # Quantos itens podem ser consumidos.

# Função para manipular conexões de produtores e consumidores
def handle_client(connection, address):
    global buffer
    print(f"Conexão recebida de {address}")
    
    while True:
        # Recebe a mensagem do cliente
        data = connection.recv(1024).decode()
        if not data:
            break
        
        # O cliente pode ser um "produtor" ou um "consumidor"
        if data.startswith('PRODUZIR'):
            item = data.split()[1]  # O item a ser produzido
            if empty.acquire(timeout=1):
                mutex.acquire()  # Bloqueia o acesso ao buffer
                buffer.append(item)
                print(f"Produtor {address} adicionou {item}. Buffer: {buffer}")
                mutex.release()  # Libera o buffer
                full.release()   # Informa que um item foi produzido
                connection.send(f"Item {item} adicionado ao buffer.\n".encode())
            else:
                # Se o buffer está vazio
                connection.send("Buffer cheio, tente novamente mais tarde.\n".encode())
    
        
        elif data == 'CONSUMIR':
            if full.acquire(timeout=1):  # Tenta adquirir o semáforo, com timeout de 1 segundo
                # Consumir do buffer
                mutex.acquire()  # Trava o acesso ao buffer
                item = buffer.pop(0)
                print(f"Consumidor {address} consumiu {item}. Buffer: {buffer}")
                mutex.release()  # Libera o buffer
                empty.release()  # Libera um espaço vazio
                connection.send(f"Item {item} consumido do buffer.\n".encode())
            else:
                # Se o buffer está vazio
                connection.send("Buffer vazio, tente novamente mais tarde.\n".encode())
    
        else:
            connection.send("Comando inválido!\n".encode())

    print(f"Conexão encerrada {address}")
    connection.close()

# Função principal do servidor
def start_server():
    # Cria o socket do servidor
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind(('localhost', 65432))
    server_socket.listen(5)
    print("Servidor de Buffer Iniciado. Aguardando conexões...")

    while True:
        # Aceita conexões dos produtores ou consumidores
        client_socket, addr = server_socket.accept()
        client_handler = threading.Thread(target=handle_client, args=(client_socket, addr))
        client_handler.start()

if __name__ == "__main__":
    start_server()
