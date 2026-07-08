"""Tests for backend authentication."""

from unittest.mock import patch

import pytest

from backend.auth import verify_credentials, create_session_token


class TestAuth:
    """Test authentication utilities."""

    def test_verify_correct_credentials(self):
        """Test that correct credentials are verified."""
        assert verify_credentials("user", "password") is True

    def test_verify_wrong_username(self):
        """Test that wrong username fails."""
        assert verify_credentials("wrong", "password") is False

    def test_verify_wrong_password(self):
        """Test that wrong password fails."""
        assert verify_credentials("user", "wrong") is False

    def test_verify_empty_credentials(self):
        """Test that empty credentials fail."""
        assert verify_credentials("", "") is False

    def test_create_session_token_is_unique(self):
        """Test that each call creates a different token."""
        token1 = create_session_token()
        token2 = create_session_token()
        assert token1 != token2
        assert len(token1) > 0
        assert len(token2) > 0



def test_signin_with_valid_credentials():
    """Test that valid credentials verify successfully."""
    assert verify_credentials("user", "password") is True


def test_signin_with_wrong_username():
    """Test that wrong username verification fails."""
    assert verify_credentials("wrong", "password") is False


def test_signin_with_wrong_password():
    """Test that wrong password verification fails."""
    assert verify_credentials("user", "wrong") is False
