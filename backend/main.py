import json
import os
import sqlite3
import urllib.request
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from backend.auth import verify_credentials, create_session_token
from backend.database import init_db, get_db, seed_initial_board

# ============================================================================
# Request/Response Models
# ============================================================================


class SignInRequest(BaseModel):
    username: str
    password: str


class SignInResponse(BaseModel):
    user_id: str
    username: str
    token: str


class BoardUpdateRequest(BaseModel):
    columns: list
    cards: dict


# ============================================================================
# App Initialization
# ============================================================================

# Initialize database on module load
init_db()

app = FastAPI()

# location where a static export would live if present
STATIC_DIR = Path(__file__).resolve().parents[1] / "frontend" / "out"


# ============================================================================
# Auth Routes
# ============================================================================


@app.post("/api/auth/signin")
def signin(request: SignInRequest) -> SignInResponse:
    """Sign in with username and password."""
    if not verify_credentials(request.username, request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # For MVP, user_id is hardcoded
    user_id = "user-default"
    token = create_session_token()

    # Create user and board if they don't exist
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Insert user (ignore if exists)
        cursor.execute(
            """
            INSERT OR IGNORE INTO users (id, username, password_hash)
            VALUES (?, ?, ?)
            """,
            (user_id, request.username, "mvc-hardcoded"),
        )

        # Check if board exists
        cursor.execute("SELECT id FROM boards WHERE user_id = ?", (user_id,))
        existing_board = cursor.fetchone()

        if not existing_board:
            seed_initial_board(user_id)

        conn.commit()
    finally:
        conn.close()

    return SignInResponse(user_id=user_id, username=request.username, token=token)


# ============================================================================
# Board Routes
# ============================================================================


@app.get("/api/boards")
def get_board(user_id: str = "user-default") -> dict:
    """Get the board for the authenticated user."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT board_data FROM boards WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Board not found")

        board_data = json.loads(row[0])
        return board_data
    finally:
        conn.close()


@app.patch("/api/boards")
def update_board(request: BoardUpdateRequest, user_id: str = "user-default") -> dict:
    """Update the board for the authenticated user."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Validate that board exists
        cursor.execute("SELECT id FROM boards WHERE user_id = ?", (user_id,))
        board = cursor.fetchone()

        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        # Update board data
        board_data = {"columns": request.columns, "cards": request.cards}
        cursor.execute(
            """
            UPDATE boards SET board_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (json.dumps(board_data), user_id),
        )

        conn.commit()
        return {"success": True}
    finally:
        conn.close()


# ============================================================================
# Health Check
# ============================================================================


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# ============================================================================
# Frontend Routes
# ============================================================================


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


# Only mount static files if a static export exists; mounting is optional
if STATIC_DIR.exists():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
