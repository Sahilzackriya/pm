#!/bin/bash
set -e

echo "Starting PM backend..."
python -m uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000
