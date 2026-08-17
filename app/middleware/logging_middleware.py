import time
import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

logger = structlog.get_logger("api.requests")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        #process the request
        response = await call_next(request)

        #calculate how long it took
        process_time_ms = (time.time() - start_time) * 1000

        #logging the details
        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(process_time_ms, 2)
        )

        return response

