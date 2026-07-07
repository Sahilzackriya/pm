from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pathlib import Path
import os
import urllib.request

app = FastAPI()

# location where a static export would live if present
STATIC_DIR = Path(__file__).resolve().parents[1] / "frontend" / "out"


@app.get("/", response_class=HTMLResponse)
def root() -> str:
    """Return the frontend index if available, otherwise proxy to a
    running frontend at http://localhost:3000, and finally fall back to a
    simple HTML message for the bare backend scaffold.
    """
    # serve an exported static index if it exists
    index = STATIC_DIR / "index.html"
    if index.exists():
        return HTMLResponse(index.read_text(encoding="utf-8"))

    # attempt to fetch from a running frontend server (useful during dev)
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    try:
        with urllib.request.urlopen(frontend_url) as resp:
            content = resp.read()
            return HTMLResponse(content, media_type="text/html")
    except Exception:
        # finally, simple fallback for the minimal scaffold
        return HTMLResponse("<html><body><h1>Hello from PM backend</h1></body></html>")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Only mount static files if a static export exists; mounting is optional
if STATIC_DIR.exists():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
