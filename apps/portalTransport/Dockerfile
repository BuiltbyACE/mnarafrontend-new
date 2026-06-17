FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run portalTransport:build:production

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/portalTransport /usr/share/nginx/html/transport
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
