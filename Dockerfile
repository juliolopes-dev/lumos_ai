# Dockerfile único para Lumos IA
# Roda frontend (nginx) + backend (node) em um único container

# ========== Stage 1: Build Frontend ==========
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ========== Stage 2: Build Backend ==========
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# ========== Stage 3: Production ==========
FROM node:20-alpine

# Instalar nginx e supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copiar backend
COPY --from=backend-builder /app/backend ./backend

# Copiar frontend build para nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copiar configuração do nginx (com proxy /api)
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copiar configuração do supervisor
COPY supervisord.conf /etc/supervisord.conf

# Expor porta 80
EXPOSE 80

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Iniciar supervisor (gerencia nginx + node)
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
