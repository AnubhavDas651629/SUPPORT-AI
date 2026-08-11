class InvalidApiKeyException(Exception):
    def __init__(self, message: str = "Invalid, missing, or revoked API key."):
        super().__init__(message)


class ApiKeyNotFoundException(Exception):
    def __init__(self, message: str = "API key not found."):
        super().__init__(message)
