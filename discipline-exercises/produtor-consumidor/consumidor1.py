import socket
import time

def consumer():
    # Conecta ao servidor
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect(('localhost', 65432))
        message = 'CONSUMIR'
        s.sendall(message.encode())
        data = s.recv(1024)
        print(f"Servidor: {data.decode()}")

if __name__ == "__main__":
    for i in range(1, 100):
        consumer()
        time.sleep(8)  # Simula tempo entre consumos
