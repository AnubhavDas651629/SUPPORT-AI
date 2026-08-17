# 1. THE BASE IMAGE
# We don't want to build a Linux operating system from scratch. 
# This line tells Docker: "Download a pre-built mini-Linux computer that already has Python 3.12 installed."
FROM python:3.12-slim

# 2. INSTALL SYSTEM LIBRARIES
# Some Python packages (like 'asyncpg' and 'psycopg2' for Postgres) need C++ compilers to be installed on the Linux machine.
# This runs the standard Ubuntu 'apt-get' command to install those C++ tools.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. INSTALL UV
# We are copying the 'uv' package manager directly from the internet into our mini-computer.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 4. SET THE WORKSPACE
# This tells Docker: "Create a folder called /app inside the mini-computer, and do everything else inside this folder."
WORKDIR /app

# 5. COPY REQUIREMENTS
# We copy your pyproject.toml from your Mac into the /app folder inside the mini-computer.
COPY pyproject.toml README.md ./

# 6. INSTALL PYTHON PACKAGES
# This tells 'uv' to read pyproject.toml and install all your dependencies globally inside the container.
RUN uv pip install --system .

# 7. COPY YOUR CODE
# This copies EVERYTHING from your Mac (the 'app' folder, etc.) into the /app folder inside the mini-computer.
# (We do this AFTER installing dependencies so that if you change a python file, Docker doesn't have to reinstall all packages!)
COPY . .

# 8. OPEN THE PORT
# This tells Docker to punch a hole in the sealed box so traffic can reach port 8000.
EXPOSE 8000

# 9. THE START COMMAND
# When someone finally turns the box on, this is the command that will run to start FastAPI.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
