FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn pydantic

# Copy application files
COPY api.py .
COPY reddit_framework.md .
COPY extracted_data.json .
COPY process_data.py .
COPY posts.json .
COPY comments.json .

# Expose port
EXPOSE 8000

# Run the API
CMD ["python", "api.py"]
