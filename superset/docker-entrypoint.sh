#!/bin/bash
set -e

echo "Initializing Superset..."

superset db upgrade

superset fab create-admin \
  --username admin \
  --firstname Superset \
  --lastname Admin \
  --email admin@superset.com \
  --password admin

superset init

echo "Starting Superset..."
exec gunicorn \
    --bind 0.0.0.0:8088 \
    --workers 1 \
    --worker-class gthread \
    --threads 2 \
    --timeout 60 \
    --limit-request-line 0 \
    --limit-request-field_size 0 \
    "superset.app:create_app()"
