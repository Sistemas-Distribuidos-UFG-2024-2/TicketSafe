# Usar uma imagem base do Node.js
FROM node:18

# Instalar netcat-openbsd
RUN apt-get update && apt-get install -y netcat-openbsd

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o package.json e package-lock.json para a imagem
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Expor a porta que a aplicação vai usar (ajuste se necessário)
EXPOSE 5007

# Comando para iniciar o worker de confirmação
CMD ["node", "workerReserveWaitingService.js"]
