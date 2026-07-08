"""Authentication utilities."""

import hashlib
import secrets
from typing import Optional

# MVP: hardcoded credentials
VALID_USERNAME = "user"
VALID_PASSWORD = "password"


def hash_password(password: str) -> str:
    """Hash a password using SHA256 (for MVP; use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_credentials(username: str, password: str) -> bool:
    """Verify username and password against hardcoded MVP credentials."""
    return username == VALID_USERNAME and password == VALID_PASSWORD


def create_session_token() -> str:
    """Create a simple session token (MVP; use proper JWT in production)."""
    return secrets.token_urlsafe(32)
