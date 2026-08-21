from locust import HttpUser, task, between
import uuid

class SupportAILoadTest(HttpUser):
    # This tells the virtual user to wait between 1 and 3 seconds after every task they complete.
    wait_time = between(1, 3)
    
    def on_start(self):
        """
        This function runs exactly once when a Virtual User is spawned.
        We will use it to register a fake account so the user can hit authenticated endpoints.
        """
        self.email = f"loadtest_{uuid.uuid4()}@example.com"
        self.password = "loadtest_secure_password"
        
        # Register a fake user in the database
        self.client.post("/api/v1/auth/register", json={
            "email": self.email,
            "password": self.password,
            "full_name": "Virtual Load Tester"
        })
        
        # 2. Login to get a JWT token
        response = self.client.post("/api/v1/auth/login", data={
            "username": self.email,
            "password": self.password
        })
        
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}

    @task(3)
    def ping_home_page(self):
        """
        Simulates a user just visiting the root URL to check if the server is alive.
        The @task(3) means this task is 3 times more likely to be picked than @task(1).
        """
        self.client.get("/")
        
    @task(1)
    def simulate_widget_chat_rejection(self):
        """
        Simulates an unauthorized visitor trying to stream chat from the widget API.
        This tests how fast your API Gateway and Redis Rate Limiter can reject bad traffic.
        """
        self.client.post(
            "/api/v1/widget/chat/stream", 
            json={"conversation_id": str(uuid.uuid4()), "question": "Are you alive?"}
        )
