# Use a imagem base oficial do Redis
FROM redis:6.2

# Atualiza a lista de pacotes e instala o netcat-openbsd (uma versão do netcat)
RUN apt-get update && apt-get install -y netcat-openbsd

# Instala o Node.js e o npm para rodar o script de sincronização
RUN apt-get update && apt-get install -y nodejs npm
# Instala o dos2unix para converter o script para o formato Unix
RUN apt-get update && apt-get install -y dos2unix


# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos do diretório atual para o diretório de trabalho no container
COPY . .

# Dá permissão de execução para o script entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

# Verifica se o script entrypoint.sh está no local correto
RUN ls -l /usr/src/app/entrypoint.sh
# Converte o entrypoint.sh para o formato Unix
RUN dos2unix /usr/src/app/entrypoint.sh

# Instala as dependências do Node.js
RUN npm install

# Exponha a porta padrão do Redis
EXPOSE 6379

# Define o script de entrada
ENTRYPOINT ["/bin/bash", "/usr/src/app/entrypoint.sh"]

# Caso seja necessário, defina o comando padrão, caso o entrypoint falhe
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
