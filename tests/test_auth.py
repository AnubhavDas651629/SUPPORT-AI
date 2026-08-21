import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    """
    Integration test that verifies the full authentication flow:
    1. A user can successfully register with a new email and password.
    2. The API returns the created user without the password.
    3. The user can then login with those exact credentials.
    4. The API returns a valid JWT access token.
    """
    test_email = f"test_{uuid.uuid4()}@example.com"
    test_password = "securepassword123"
    
    # --- Step 1: Register ---
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Test User"
        }
    )
    
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"
    data = register_response.json()
    assert data["email"] == test_email
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data # Ensure password isn't leaked
    
    # --- Step 2: Login ---
    # FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded data, not JSON
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": test_email,
            "password": test_password
        }
    )
    
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    token_data = login_response.json()
    
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
