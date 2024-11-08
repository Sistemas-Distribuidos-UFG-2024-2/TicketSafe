# Use a imagem base oficial do Redis
FROM redis:6.0

# Instala o Node.js e o npm para rodar o script de sincronização
RUN apt-get update && apt-get install -y nodejs npm

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos para o diretório de trabalho
COPY . .

# Instala as dependências do Node.js
RUN npm install

# Exponha a porta padrão do Redis
EXPOSE 6379

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
