FROM apache/superset:latest

USER root

COPY requirements.txt .
RUN uv pip install -r requirements.txt

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

USER superset

ENTRYPOINT ["/bin/bash", "/docker-entrypoint.sh"]