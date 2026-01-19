# Usar imagem Node LTS
FROM node:20-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para o Prisma (openssl)
RUN apk -U upgrade && apk add --no-cache openssl

# Copiar apenas os arquivos de dependência do backend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

# Instalar dependências
WORKDIR /app/backend
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar o resto do código do backend
COPY backend/ .

# Buildar a aplicação
RUN npm run build

# Expor a porta que o NestJS usa (padrão 3000, mas Fly usa ENV PORT)
ENV PORT=3000
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "run", "start:prod"]
