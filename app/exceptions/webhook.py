class WebhookNotFoundException(Exception):
    def __init__(self, message: str = "Webhook endpoint not found."):
        super().__init__(message)
