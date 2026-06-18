FROM nginx:1.27-alpine
RUN apk add --no-cache curl
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/sites/tiktakrun.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /etc/nginx/ssl /storage/uploads && chmod 755 /storage/uploads
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
