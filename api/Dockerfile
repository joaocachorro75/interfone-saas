# Dockerfile da API Interfone SaaS
FROM node:18-alpine

# Instala dependências build
RUN apk add --no-cache python3 make g++

# Diretório de trabalho
WORKDIR /app

# Copia dependências
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Remove cache e ferramentas de build
RUN apk del python3 make g++

# Copia aplicação
COPY . .

# Cria diretório para logs
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Comando de inicialização
CMD ["node", "server.js"]
