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

# Comando para iniciar o worker
CMD ["node", "workersyncService.js"]
