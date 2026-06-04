#ETAPA 1: BUILD
FROM node:20-alpine AS builder

#Definir el directorio de trabajo
WORKDIR /app

COPY package*.json ./

#Instalar las dependencias
RUN npm ci

#Copiar el resto de los archivos del proyecto
COPY . .

RUN npm run build

#ETAPA 2: RUN (Imagen final)
FROM node:20-alpine

#Directorio de trabajo
WORKDIR /app

#Activar optimizaciones de rendimiento
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]