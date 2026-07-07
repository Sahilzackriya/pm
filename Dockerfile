#############################
# Build frontend (Node)
#############################
FROM node:20-alpine AS node-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json* ./
COPY frontend/ .
RUN npm ci --no-audit --no-fund
RUN npm run build


#############################
# Runtime image (Python)
#############################
FROM python:3.12-slim
WORKDIR /app

RUN python -m pip install --upgrade pip
RUN python -m pip install uv

# Copy backend source and install its dependencies from the project
# Use pip to install the local backend package which reads pyproject.toml
# and installs declared dependencies.
COPY backend/ ./backend/
RUN python -m pip install ./backend

# Copy built frontend (static export) into the image so backend can serve it.
# We copy the whole frontend directory built in the node stage; the backend
# will look for `frontend/out` at runtime.
COPY --from=node-build /build/frontend /app/frontend

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
