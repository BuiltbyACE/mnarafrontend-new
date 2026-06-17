FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run portalAdmin:build:production

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/portalAdmin /usr/share/nginx/html/admin
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
