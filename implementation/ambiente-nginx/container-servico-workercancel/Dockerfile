# Usar uma imagem base do Node.js
FROM node:14

RUN apt-get update && apt-get install -y netcat

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o package.json e package-lock.json para a imagem
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Expor a porta que a aplicação vai usar
EXPOSE 5003

# Comando para iniciar a aplicação
CMD ["node", "workercancelService.js"]
