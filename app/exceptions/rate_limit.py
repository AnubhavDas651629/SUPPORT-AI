class RateLimitExceededException(Exception):
    def __init__(
        self,
        retry_after: int = 60,
        limit: int = 20,
        message: str | None = None,
        **kwargs,
    ):
        self.retry_after = kwargs.get("retry_after", retry_after)
        self.limit = kwargs.get("limit", limit)
        msg = message or f"Rate limit exceeded. Try again in {self.retry_after} seconds"
        super().__init__(msg)
