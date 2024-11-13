# Use a imagem base oficial do Redis
FROM redis:6.2

# Atualiza a lista de pacotes e instala o netcat-openbsd (uma versão do netcat)
RUN apt-get update && apt-get install -y netcat-openbsd

# Instala o Node.js e o npm para rodar o script de sincronização
RUN apt-get update && apt-get install -y nodejs npm

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos do diretório atual para o diretório de trabalho no container
COPY . .

# Dá permissão de execução para o script entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

# Instala as dependências do Node.js
RUN npm install

# Exponha a porta padrão do Redis
EXPOSE 6379

# Define o script de entrada
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
