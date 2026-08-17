import logging
import structlog
from asgi_correlation_id import correlation_id

"""
Structured Logging (structlog): We are going to change our logs from standard text to JSON format. Why? Because in production, you will send your logs to a service like Datadog or AWS CloudWatch. JSON allows those services to filter and search logs easily (e.g., "Show me all logs where status_code == 500").
Correlation IDs: Imagine a user makes a request, and your app does 5 different things. A Correlation ID is a unique random string (like abc-123) attached to that specific request. Every log related to that user's click will have correlation_id: "abc-123". This makes debugging 100x easier!
Middlewares: A middleware is like a bouncer at a club. It intercepts every single request before it hits your endpoints, and after it leaves. We will write a logging middleware that automatically logs exactly how many milliseconds every request took.
"""

def setup_logging(json_logs: bool = True):
    # This function injects the correlation ID into every log
    def add_correlation_id(logger, method_name, event_dict):
        req_id = correlation_id.get()
        if req_id:
            event_dict["correlation_id"] = req_id
        return event_dict

    # Determine if we output JSON (for production) or colored text (for local dev)
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name, 
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        add_correlation_id,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard Python logging to route through structlog
    logging.basicConfig(format="%(message)s", level=logging.INFO)