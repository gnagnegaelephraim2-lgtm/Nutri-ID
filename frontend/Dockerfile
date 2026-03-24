# =============================================================================
# Stage 1: Build the React/Vite app
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# =============================================================================
# Stage 2: Serve the static build with Nginx
# =============================================================================
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# Copy nginx config as a template; BACKEND_URL is substituted at container startup
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80
# envsubst replaces only ${BACKEND_URL}, leaving nginx's own $variables intact
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
