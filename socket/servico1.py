import socket

HOST = '127.0.0.1'  # Endereço IP do servidor (localhost)
PORT = 65432        # Porta usada pelo servidor

# Cria um socket TCP/IP
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))  # Vincula o endereço e porta ao socket
    s.listen()            # Habilita o servidor a aceitar conexões (modo escuta)
    print(f"Serviço ouvindo em {HOST}:{PORT}")

    while True:
        conn, addr = s.accept()  # Espera por uma conexão
        with conn:
            print(f"Conectado por {addr}")
            while True:
                data = conn.recv(1024)  # Recebe dados do cliente
                
                if not data:
                    break  
                
                decoded_data = data.decode('utf-8').strip()  # Decodifica e remove espaços em branco
                
                if decoded_data == "": 
                    conn.sendall("Sem retorno, o serviço não aceita mensagens vazias ou nulas".encode('utf-8'))
                    break  

                elif decoded_data == "Hello":
                    response = "World1"
                    conn.sendall(response.encode('utf-8'))
                    break
                else:
                    conn.sendall("Sem retorno, o serviço espera pela mensagem 'Hello'".encode('utf-8')) 
                    break

                print(f"Mensagem recebida: {decoded_data}")
