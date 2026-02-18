FROM python:3.12-slim

LABEL org.opencontainers.image.version="0.9.0" \
      org.opencontainers.image.title="Daily Flow - Task Management App" \
      org.opencontainers.image.description="A modern task management application with advanced features including drag-drop, recurring tasks, filtering, search, priorities, multiple projects, categories, export, progress charts, and dark mode"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5000

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py ./
COPY templates ./templates
COPY static ./static

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/')"

# Run the application
CMD ["python", "app.py"]
