# Build the Vite production bundle.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Vite replaces these values at build time. Override them with docker compose
# environment variables when deploying a different API endpoint.
ARG VITE_TUNAS_API_URL=https://api.hijau-ai.web.id
ARG VITE_MISSION_TRANSPORT=demo
ENV VITE_TUNAS_API_URL=$VITE_TUNAS_API_URL
ENV VITE_MISSION_TRANSPORT=$VITE_MISSION_TRANSPORT

RUN npm run build

# Serve the generated SPA with Nginx.
FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
