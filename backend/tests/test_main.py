from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def test_root_returns_html() -> None:
    response = client.get("/")
    assert response.status_code == 200
    # root may now serve the frontend HTML (when running) or the simple
    # backend fallback. Accept either to keep the test robust in both modes.
    assert response.headers["content-type"].startswith("text/html")
    assert (
        "Hello from PM backend" in response.text
        or "Kanban" in response.text
    )


def test_health_endpoint() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
