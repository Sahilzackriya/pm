"""OpenRouter client for MVP AI calls."""

import json
import os
import urllib.error
import urllib.request
from pathlib import Path

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-oss-120b"
PROJECT_ROOT = Path(__file__).resolve().parents[1]


class OpenRouterError(Exception):
    """Raised when OpenRouter returns an invalid or failed response."""


def _read_env_file_value(name: str) -> str | None:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        if key.strip() == name:
            return value.strip().strip('"').strip("'")

    return None


def get_openrouter_api_key() -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY") or _read_env_file_value(
        "OPENROUTER_API_KEY"
    )
    if not api_key:
        raise OpenRouterError("OPENROUTER_API_KEY is not configured")
    return api_key


def ask_openrouter(message: str) -> str:
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": message}],
        "temperature": 0,
    }
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {get_openrouter_api_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Project Management MVP",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise OpenRouterError(
            f"OpenRouter request failed with status {error.code}: {detail}"
        ) from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise OpenRouterError(f"OpenRouter request failed: {error}") from error

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise OpenRouterError("OpenRouter response did not include message content") from error

    if not isinstance(content, str) or not content.strip():
        raise OpenRouterError("OpenRouter returned an empty response")

    return content.strip()
