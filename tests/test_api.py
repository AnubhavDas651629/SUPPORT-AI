from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """
    Test the root endpoint (/) to ensure the API is online.
    """
    # 1. Simulate a browser making a GET request to "/"
    response = client.get("/")
    
    # 2. Check that the server responds with a 200 OK status
    assert response.status_code == 200
    
    # 3. Check that the JSON response matches what we expect
    assert response.json() == {"message": "Welcome to SupportAI"}

