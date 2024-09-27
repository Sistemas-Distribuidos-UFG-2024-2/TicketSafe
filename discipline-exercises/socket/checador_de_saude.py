import socket
import threading
import time

SERVIDORES_ATIVOS = {}  # Armazena o status dos servidores com o último timestamp de atividade
TIMEOUT_SERVIDOR = 5  # Tempo para considerar um servidor inativo (em segundos)
HOST = '127.0.0.1'  
PORT = 65431  
lock = threading.Lock()  # Cria um lock para controlar o acesso à lista

def processar_sinal(conn, addr):
    with conn:
        data = conn.recv(1024).decode('utf-8')
        if data:
            ip, porta = data.split(':')  # Extrai o IP e a porta
            porta = int(porta)  # Converte a porta para inteiro
            with lock:
                if ip in SERVIDORES_ATIVOS:
                    # Se o IP já estiver na lista, atualiza a porta e o timestamp ou adiciona nova porta
                    portas_e_timestamps = SERVIDORES_ATIVOS[ip]
                    # Remove a porta existente se houver, e adiciona a nova com timestamp atualizado
                    portas_e_timestamps = [(p, ts) for p, ts in portas_e_timestamps if p != porta]
                    portas_e_timestamps.append((porta, time.time()))
                    SERVIDORES_ATIVOS[ip] = portas_e_timestamps
                else:
                    # Adiciona uma nova entrada para o IP
                    SERVIDORES_ATIVOS[ip] = [(porta, time.time())]
            print(f"[HEALTH-CHECKER] - Recebido sinal de atividade de {ip}:{porta}")

def ouvir_sinais_servidores():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))  # Escuta na porta especificada
        s.listen()
        print(f"[HEALTH-CHECKER] - ouvindo em {HOST}:{PORT}")

        while True:
            conn, addr = s.accept()  # Aceita conexão do servidor enviando sinal de atividade
            # Cria uma nova thread para processar o sinal do servidor
            threading.Thread(target=processar_sinal, args=(conn, addr)).start()

def verificar_servidores_inativos():
    while True:
        with lock:
            for ip, portas_e_timestamps in list(SERVIDORES_ATIVOS.items()):
                # Verifica se todas as timestamps de um IP estão expirados
                portas_e_timestamps = [(porta, ts) for porta, ts in portas_e_timestamps if time.time() - ts <= TIMEOUT_SERVIDOR]
                
                if not portas_e_timestamps:  # Se todas as portas expiraram, remove o servidor
                    print(f"[HEALTH-CHECKER] - Servidor {ip} inativo!")
                    del SERVIDORES_ATIVOS[ip]
                else:
                    # Atualiza o IP com a lista de portas e timestamps ativos
                    SERVIDORES_ATIVOS[ip] = portas_e_timestamps
        
        time.sleep(5)  # Intervalo de verificação de 5 segundos

# Função para enviar a lista de servidores ativos ao balanceador de carga
def enviar_servidores_ativos():
    BALANCEADOR_HOST = '127.0.0.1'
    BALANCEADOR_PORT = 65429
    while True:
        try:
            with lock:
                # Copia a lista de servidores ativos com IP e Porta
                servidores_ativos = dict(SERVIDORES_ATIVOS)
            
            if servidores_ativos:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.connect((BALANCEADOR_HOST, BALANCEADOR_PORT))

                    # Formatação de IP e Porta no formato "ip:porta"
                    servidores_str = ','.join(
                        [f"{ip}:{porta}" for ip, portas in servidores_ativos.items() for porta, _ in portas]
                    )
                    
                    # Envio da lista de servidores ativos
                    s.sendall(servidores_str.encode('utf-8'))
                    
                    # Log do envio
                    print(f"[HEALTH-CHECKER] - Enviada lista de servidores ativos: {servidores_str}")
            else:
                # Caso a lista esteja vazia, envia uma string vazia
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.connect((BALANCEADOR_HOST, BALANCEADOR_PORT))
                    s.sendall('NO-SERVERS'.encode('utf-8'))
                    print("[HEALTH-CHECKER] - Enviada lista de servidores ativos: NO-SERVERS")
                    
        except Exception as e:
            print(f"Erro ao enviar lista de servidores ativos: {e}")
        
        # Intervalo de envio de 5 segundos
        time.sleep(5)


if __name__ == "__main__":
    threading.Thread(target=ouvir_sinais_servidores, daemon=True).start()
    threading.Thread(target=verificar_servidores_inativos, daemon=True).start()
    enviar_servidores_ativos()
