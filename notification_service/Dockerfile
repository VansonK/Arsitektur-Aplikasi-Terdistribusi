# Use Python 3.12 slim as the base
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# We need 'gcc' and 'librdkafka-dev' if you use confluent-kafka
# 'curl' is useful for the healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    librdkafka-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# Ensure your folder structure has the 'app' folder here
COPY . .

# Expose the port the service runs on
EXPOSE 8000

# Command to run the application
# Using app.main:app assuming your FastAPI instance is in app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]