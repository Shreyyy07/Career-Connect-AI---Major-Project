# Use a lightweight official Python 3.10 image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required by OpenCV (cv2) and DeepFace
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Start Uvicorn on port 7860 (Hugging Face Spaces requirement)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
