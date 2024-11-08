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

# Expor a porta que a aplicação vai usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "reserveService.js"]
