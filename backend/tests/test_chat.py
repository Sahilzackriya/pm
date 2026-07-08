import json

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.ai_board import BoardData, build_ai_messages, parse_ai_response
from backend.database import get_db, seed_initial_board
from backend.main import app
from backend.openrouter import (
    OPENROUTER_MODEL,
    OpenRouterError,
    get_openrouter_api_key,
)

client = TestClient(app)


def test_chat_requires_message() -> None:
    response = client.post("/api/chat", json={"message": "   "})

    assert response.status_code == 400
    assert response.json()["detail"] == "Message is required"


def test_chat_calls_openrouter_for_simple_answer() -> None:
    try:
        get_openrouter_api_key()
    except OpenRouterError as error:
        pytest.skip(str(error))

    response = client.post(
        "/api/chat",
        json={"message": "Answer with only the number: what is 2+2?"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["model"] == OPENROUTER_MODEL
    assert "4" in data["response"]
    assert data["board_updated"] is False


def sample_board() -> BoardData:
    return BoardData.model_validate(
        {
            "columns": [
                {"id": "todo", "title": "To do", "cardIds": ["card-1"]},
                {"id": "done", "title": "Done", "cardIds": []},
            ],
            "cards": {
                "card-1": {
                    "id": "card-1",
                    "title": "Write tests",
                    "details": "Cover AI updates",
                }
            },
        }
    )


def test_build_messages_includes_history_and_board() -> None:
    messages = build_ai_messages(
        "Move the card",
        [{"role": "assistant", "content": "Which card?"}],
        sample_board(),
    )

    assert messages[1] == {"role": "assistant", "content": "Which card?"}
    assert '"card-1"' in messages[2]["content"]
    assert "Move the card" in messages[2]["content"]


def test_parse_valid_board_update() -> None:
    board = sample_board()
    updated = board.model_copy(deep=True)
    updated.columns[0].cardIds = []
    updated.columns[1].cardIds = ["card-1"]

    result = parse_ai_response(
        '{"response":"Moved it.","board":' + updated.model_dump_json() + "}",
        board,
    )

    assert result.response == "Moved it."
    assert result.board is not None
    assert result.board.columns[1].cardIds == ["card-1"]


@pytest.mark.parametrize(
    "content",
    [
        "not json",
        '{"response":"","board":null}',
        '{"response":"Done","board":{"columns":[],"cards":{}}}',
        (
            '{"response":"Done","board":{"columns":'
            '[{"id":"todo","title":"To do","cardIds":["missing"]},'
            '{"id":"done","title":"Done","cardIds":[]}],"cards":{}}}'
        ),
    ],
)
def test_parse_rejects_invalid_structured_responses(content: str) -> None:
    with pytest.raises(ValueError):
        parse_ai_response(content, sample_board())


def test_chat_persists_valid_ai_board_update() -> None:
    conn = get_db()
    conn.execute("DELETE FROM boards WHERE user_id = ?", ("ai-test-user",))
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (?, ?, ?)",
        ("ai-test-user", "ai-test-user", "test"),
    )
    seed_initial_board("ai-test-user", conn)
    conn.commit()
    original = client.get("/api/boards?user_id=ai-test-user").json()
    original["cards"]["card-1"]["title"] = "AI changed this"
    model_response = json.dumps({"response": "Updated the card.", "board": original})

    with patch("backend.main.ask_openrouter_messages", return_value=model_response):
        response = client.post(
            "/api/chat",
            json={
                "message": "Rename card one",
                "history": [{"role": "user", "content": "Help with my board"}],
                "user_id": "ai-test-user",
            },
        )

    conn.close()
    assert response.status_code == 200
    assert response.json()["board_updated"] is True
    stored = client.get("/api/boards?user_id=ai-test-user").json()
    assert stored["cards"]["card-1"]["title"] == "AI changed this"
