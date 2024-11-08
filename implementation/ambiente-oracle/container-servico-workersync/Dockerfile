# Usar uma imagem base do Node.js
FROM node:14

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
