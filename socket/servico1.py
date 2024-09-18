import socket
import threading
import time

HOST = '127.0.0.2'  # Endereço IP do servidor (localhost)
PORT = 65432        # Porta usada pelo servidor
CHECADOR_DE_SAUDE_HOST = '127.0.0.1'  
CHECADOR_DE_SAUDE_PORT = 65431        

def aguardar_conexao():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))  # Vincula o endereço e porta ao socket
        s.listen()            # Habilita o servidor a aceitar conexões (modo escuta)
        print(f"Serviço ouvindo em {HOST}:{PORT}")

        while True:
            conn, addr = s.accept()  # Espera por uma conexão
            # Cria uma nova thread para lidar com a conexão do cliente
            threading.Thread(target=lidar_conexao, args=(conn, addr), daemon=True).start()

def lidar_conexao(conn, addr):
    with conn:
        print(f"Conectado por {addr}")
        while True:
            data = conn.recv(1024)  # Recebe dados do cliente
            
            if not data:
                break  # Encerra a conexão se não houver dados
            
            decoded_data = data.decode('utf-8').strip()  # Decodifica e remove espaços em branco
            
            if decoded_data == "":
                conn.sendall("Sem retorno, o serviço não aceita mensagens vazias ou nulas".encode('utf-8'))
            elif decoded_data == "Hello":
                response = "World1"
                conn.sendall(response.encode('utf-8'))
            else:
                conn.sendall("Sem retorno, o serviço espera pela mensagem 'Hello'".encode('utf-8'))
            
            print(f"Mensagem recebida: {decoded_data}")

def enviar_sinal():
    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                # Usa uma porta dinâmica para enviar o sinal
                s.bind((HOST, 0))  # 0 indica que o sistema escolhe uma porta disponível
                s.connect((CHECADOR_DE_SAUDE_HOST, CHECADOR_DE_SAUDE_PORT))
                
                # Monta a mensagem com IP e porta de escuta
                mensagem = f"{HOST}:{PORT}"  # Ex: "127.0.0.2:65432"
                s.sendall(mensagem.encode('utf-8'))  # Envia IP e porta onde o servidor está escutando
                print(f"[SERVIDOR 1] - Sinal de atividade enviado ao checador de saúde: {mensagem}")
        except Exception as e:
            print(f"Erro ao enviar sinal de atividade: {e}")
        
        time.sleep(5)  # Intervalo de 5 segundos entre sinais

if __name__ == "__main__":
    threading.Thread(target=enviar_sinal, daemon=True).start()
    aguardar_conexao()
