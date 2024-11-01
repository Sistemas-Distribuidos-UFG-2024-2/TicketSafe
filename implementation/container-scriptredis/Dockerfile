# Use a imagem base do Node.js
FROM node:14

# Defina o diretório de trabalho
WORKDIR /usr/src/app

# Copie o script de sincronização para o contêiner
COPY sync-script.js .

# Instale as dependências necessárias
RUN npm install ioredis pg

# Instale o redis-cli
RUN apt-get update && apt-get install -y redis-tools

# Comando para executar o script
CMD ["node", "sync-script.js"]
