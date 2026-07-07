"""Database initialization and schema management."""

import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "pm.db"


def get_db() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Boards table with JSON board_data
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT DEFAULT 'My Board',
            board_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    # Index for common query
    cursor.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id)
        """
    )

    conn.commit()
    conn.close()


def seed_initial_board(user_id: str) -> str:
    """Create an initial board for a new user with demo data."""
    # Demo board data matching frontend structure
    board_data = {
        "columns": [
            {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
            {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
            {
                "id": "col-progress",
                "title": "In Progress",
                "cardIds": ["card-4", "card-5"],
            },
            {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
            {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
        ],
        "cards": {
            "card-1": {
                "id": "card-1",
                "title": "Align roadmap themes",
                "details": "Draft quarterly themes with impact statements and metrics.",
            },
            "card-2": {
                "id": "card-2",
                "title": "Gather customer signals",
                "details": "Review support tags, sales notes, and churn feedback.",
            },
            "card-3": {
                "id": "card-3",
                "title": "Prototype analytics view",
                "details": "Sketch initial dashboard layout and key drill-downs.",
            },
            "card-4": {
                "id": "card-4",
                "title": "Refine status language",
                "details": "Standardize column labels and tone across the board.",
            },
            "card-5": {
                "id": "card-5",
                "title": "Implement status filters",
                "details": "Add UI for filtering cards by status or assignee.",
            },
            "card-6": {
                "id": "card-6",
                "title": "Review designs",
                "details": "Feedback pass on current wireframes and mockups.",
            },
            "card-7": {
                "id": "card-7",
                "title": "Launch public beta",
                "details": "Deploy to staging and collect early user feedback.",
            },
            "card-8": {
                "id": "card-8",
                "title": "Documentation pass",
                "details": "Update README and API docs for new features.",
            },
        },
    }

    board_id = f"board-{user_id}"
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO boards (id, user_id, title, board_data)
        VALUES (?, ?, ?, ?)
        """,
        (board_id, user_id, "My Board", json.dumps(board_data)),
    )

    conn.commit()
    conn.close()

    return board_id
