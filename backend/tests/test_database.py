"""Tests for database schema and initialization."""

import json
import sqlite3
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from backend import database


@pytest.fixture
def temp_db():
    """Create a temporary database for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        with patch.object(database, "DB_PATH", db_path):
            yield db_path


def test_db_init_creates_schema(temp_db):
    """Test that init_db creates all required tables."""
    database.init_db()

    conn = sqlite3.connect(str(temp_db))
    cursor = conn.cursor()

    # Check tables exist
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    tables = [row[0] for row in cursor.fetchall()]
    assert "users" in tables
    assert "boards" in tables

    # Check users table schema
    cursor.execute("PRAGMA table_info(users)")
    user_cols = {row[1]: row[2] for row in cursor.fetchall()}
    assert "id" in user_cols
    assert "username" in user_cols
    assert "password_hash" in user_cols

    # Check boards table schema
    cursor.execute("PRAGMA table_info(boards)")
    board_cols = {row[1]: row[2] for row in cursor.fetchall()}
    assert "id" in board_cols
    assert "user_id" in board_cols
    assert "board_data" in board_cols
    assert "created_at" in board_cols
    assert "updated_at" in board_cols

    conn.close()


def test_seed_initial_board_creates_valid_json(temp_db):
    """Test that seeding a board creates valid JSON structure."""
    database.init_db()
    board_id = database.seed_initial_board("user-1")

    conn = sqlite3.connect(str(temp_db))
    cursor = conn.cursor()
    cursor.execute("SELECT board_data FROM boards WHERE id = ?", (board_id,))
    row = cursor.fetchone()
    assert row is not None

    board_data = json.loads(row[0])

    # Validate structure
    assert "columns" in board_data
    assert "cards" in board_data
    assert len(board_data["columns"]) > 0
    assert len(board_data["cards"]) > 0

    # Validate columns structure
    for col in board_data["columns"]:
        assert "id" in col
        assert "title" in col
        assert "cardIds" in col
        assert isinstance(col["cardIds"], list)

    # Validate cards structure
    for card_id, card in board_data["cards"].items():
        assert "id" in card
        assert "title" in card
        assert "details" in card
        assert card["id"] == card_id

    conn.close()


def test_board_data_matches_frontend_structure(temp_db):
    """Test that board_data JSON matches expected frontend BoardData type."""
    database.init_db()
    board_id = database.seed_initial_board("user-test")

    conn = sqlite3.connect(str(temp_db))
    cursor = conn.cursor()
    cursor.execute("SELECT board_data FROM boards WHERE id = ?", (board_id,))
    row = cursor.fetchone()

    board_data = json.loads(row[0])

    # Ensure all referenced cardIds exist in cards
    for col in board_data["columns"]:
        for card_id in col["cardIds"]:
            assert card_id in board_data["cards"]

    # Ensure all cards have their IDs in some column
    all_card_ids_in_columns = set()
    for col in board_data["columns"]:
        all_card_ids_in_columns.update(col["cardIds"])

    for card_id in board_data["cards"].keys():
        assert card_id in all_card_ids_in_columns

    conn.close()
