FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including docker CLI if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variable default
ENV DATA_DIR=/app/data
ENV PORT=8000

EXPOSE 8000

CMD ["python", "main.py"]
