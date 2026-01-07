#!/bin/sh

# Replace the port in nginx config with Cloud Run's PORT env variable
# Cloud Run expects the container to listen on the PORT environment variable (default 8080)
if [ -n "$PORT" ]; then
    sed -i "s/listen 8080/listen $PORT/" /etc/nginx/conf.d/default.conf
fi

# Execute the main command
exec "$@"
