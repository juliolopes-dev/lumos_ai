# Dockerfile para Lumos IA Frontend
# Multi-stage build para otimização

# === Stage 1: Build ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Variável de ambiente para build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build da aplicação
RUN npm run build

# === Stage 2: Produção com Nginx ===
FROM nginx:alpine

# Copiar build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Nginx roda em foreground
CMD ["nginx", "-g", "daemon off;"]
