# Dockerfile para Node.js (Correct for Spin4All)
FROM node:20-alpine

# Diretório de trabalho no container
WORKDIR /app

# Copiar arquivos de dependência primeiro para aproveitar cache
COPY package*.json ./

# Instalar dependências (incluindo as novas)
RUN npm install --production

# Copiar todo o código (backend e frontend)
COPY . .

# Expõe a porta que o server.js observa (3000)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
