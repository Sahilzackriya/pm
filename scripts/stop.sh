#!/bin/bash
set -e

pids=$(pgrep -f "python -m uv run uvicorn backend.main:app" || true)
if [ -n "$pids" ]; then
  echo "Stopping PM backend..."
  kill $pids
else
  echo "No backend process found."
fi
