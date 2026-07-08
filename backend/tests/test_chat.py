import pytest
from fastapi.testclient import TestClient

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
