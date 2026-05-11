# Multi-stage build for minimal image size
FROM python:3.11-alpine AS builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev libffi-dev zlib-dev jpeg-dev

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache libffi zlib libjpeg-turbo

# Create non-root user
RUN addgroup -g 1000 -S appuser && \
    adduser -u 1000 -S appuser -G appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Create directories and set permissions
RUN mkdir -p /app/generated && \
    chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser app/ ./app/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
