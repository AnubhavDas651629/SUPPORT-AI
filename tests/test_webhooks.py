"""
Tests for 6.6 — Outbound Webhooks

Covers:
  - Utility functions (secret generation, HMAC signing)
  - Pydantic schema validation
  - Model field / column mapping correctness
  - Repository method signatures
  - Service wiring (no live DB required)
"""
import hmac
import hashlib
import re
import pytest


# ─── Utility tests ────────────────────────────────────────────────────────────

class TestGenerateWebhookSecret:
    def test_prefix(self):
        from app.utils.webhook import generate_webhook_secret
        secret = generate_webhook_secret()
        assert secret.startswith("whsec_"), f"Expected 'whsec_' prefix, got: {secret}"

    def test_length_reasonable(self):
        from app.utils.webhook import generate_webhook_secret
        secret = generate_webhook_secret()
        assert len(secret) > 40

    def test_unique_each_call(self):
        from app.utils.webhook import generate_webhook_secret
        secrets = {generate_webhook_secret() for _ in range(10)}
        assert len(secrets) == 10, "Secrets should be unique on each call"


class TestSignWebhookPayload:
    def test_format(self):
        from app.utils.webhook import sign_webhook_payload
        header = sign_webhook_payload(secret="whsec_test123", payload=b'{"event":"ping"}')
        assert header.startswith("t="), f"Header should start with t=, got: {header}"
        assert ",v1=" in header, f"Header should contain ,v1=, got: {header}"

    def test_signature_is_hex(self):
        from app.utils.webhook import sign_webhook_payload
        header = sign_webhook_payload(secret="whsec_test123", payload=b"{}")
        v1_part = header.split(",v1=")[1]
        assert re.match(r"^[0-9a-f]{64}$", v1_part), f"v1 should be 64-char hex: {v1_part}"

    def test_hmac_verifiable(self):
        """Verify that the signature can be independently validated."""
        from app.utils.webhook import sign_webhook_payload
        secret = "whsec_mysecret"
        payload = b'{"event":"ticket.created"}'
        header = sign_webhook_payload(secret=secret, payload=payload)
        t_str, v1_str = header.split(",")
        timestamp = t_str[2:]
        v1 = v1_str[3:]
        signed = f"{timestamp}.".encode() + payload
        expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        assert v1 == expected, "HMAC signature mismatch"

    def test_different_payloads_give_different_signatures(self):
        from app.utils.webhook import sign_webhook_payload
        h1 = sign_webhook_payload(secret="whsec_s", payload=b'{"a":1}')
        h2 = sign_webhook_payload(secret="whsec_s", payload=b'{"a":2}')
        sig1 = h1.split(",v1=")[1]
        sig2 = h2.split(",v1=")[1]
        assert sig1 != sig2


# ─── Schema tests ─────────────────────────────────────────────────────────────

class TestWebhookEndpointCreateRequest:
    def test_valid(self):
        from app.schemas.webhook import WebhookEndpointCreateRequest
        req = WebhookEndpointCreateRequest(
            name="Slack Alerts",
            url="https://hooks.slack.com/services/xxx",
            subscribed_events=["ticket.created", "ticket.resolved"],
        )
        assert req.name == "Slack Alerts"

    def test_empty_events_raises(self):
        from app.schemas.webhook import WebhookEndpointCreateRequest
        import pydantic
        with pytest.raises(pydantic.ValidationError):
            WebhookEndpointCreateRequest(
                name="X",
                url="https://example.com",
                subscribed_events=[],
            )

    def test_invalid_url_scheme_raises(self):
        from app.schemas.webhook import WebhookEndpointCreateRequest
        import pydantic
        with pytest.raises(pydantic.ValidationError):
            WebhookEndpointCreateRequest(
                name="X",
                url="ftp://bad.example.com",
                subscribed_events=["*"],
            )

    def test_wildcard_event_accepted(self):
        from app.schemas.webhook import WebhookEndpointCreateRequest
        req = WebhookEndpointCreateRequest(
            name="All Events",
            url="https://example.com/hook",
            subscribed_events=["*"],
        )
        assert req.subscribed_events == ["*"]


class TestWebhookEndpointUpdateRequest:
    def test_all_optional(self):
        from app.schemas.webhook import WebhookEndpointUpdateRequest
        req = WebhookEndpointUpdateRequest()
        assert req.name is None
        assert req.url is None
        assert req.subscribed_events is None
        assert req.is_active is None

    def test_partial_update(self):
        from app.schemas.webhook import WebhookEndpointUpdateRequest
        req = WebhookEndpointUpdateRequest(is_active=False)
        assert req.is_active is False
        assert req.name is None


class TestWebhookTestResponse:
    def test_success_fields(self):
        from app.schemas.webhook import WebhookTestResponse
        resp = WebhookTestResponse(
            success=True,
            status_code=200,
            response_body="ok",
            duration_ms=142,
            message="Delivery successful.",
        )
        assert resp.success is True

    def test_timeout_fields(self):
        from app.schemas.webhook import WebhookTestResponse
        resp = WebhookTestResponse(
            success=False,
            status_code=None,
            response_body=None,
            duration_ms=10001,
            message="Request timed out after 10 seconds.",
        )
        assert resp.status_code is None
        assert resp.response_body is None


# ─── Model tests ──────────────────────────────────────────────────────────────

class TestWebhookEndpointModel:
    def test_consecutive_failures_python_attr(self):
        """Python attr is consecutive_failures but DB column is consecutive_failure."""
        from app.models.webhook import WebhookEndpoint
        assert hasattr(WebhookEndpoint, "consecutive_failures")

    def test_consecutive_failure_db_column_name(self):
        from app.models.webhook import WebhookEndpoint
        col = WebhookEndpoint.__table__.columns["consecutive_failure"]
        assert col is not None

    def test_response_body_nullable(self):
        from app.models.webhook import WebhookDelivery
        col = WebhookDelivery.__table__.columns["response_body"]
        assert col.nullable is True, "response_body must allow NULL for timeouts"

    def test_endpoint_has_org_fk(self):
        from app.models.webhook import WebhookEndpoint
        fks = {fk.column.table.name for fk in WebhookEndpoint.__table__.foreign_keys}
        assert "organizations" in fks

    def test_delivery_has_endpoint_fk(self):
        from app.models.webhook import WebhookDelivery
        fks = {fk.column.table.name for fk in WebhookDelivery.__table__.foreign_keys}
        assert "webhook_endpoints" in fks


# ─── Repository signature tests ───────────────────────────────────────────────

class TestWebhookRepositorySignatures:
    def test_create_endpoint_params(self):
        import inspect
        from app.repositories.webhook_repository import WebhookRepository
        sig = inspect.signature(WebhookRepository.create_endpoint)
        params = set(sig.parameters.keys())
        assert "organization_id" in params, "organization_id param missing (was orgnization_id)"
        assert "secret_encrypted" in params, "secret_encrypted param missing (was sercet_encrypted)"
        assert "orgnization_id" not in params, "typo param orgnization_id still present"
        assert "sercet_encrypted" not in params, "typo param sercet_encrypted still present"

    def test_list_endpoints_param(self):
        import inspect
        from app.repositories.webhook_repository import WebhookRepository
        sig = inspect.signature(WebhookRepository.list_endpoints)
        assert "organization_id" in sig.parameters

    def test_increment_failure_param(self):
        import inspect
        from app.repositories.webhook_repository import WebhookRepository
        sig = inspect.signature(WebhookRepository.increment_failure)
        assert "endpoint" in sig.parameters

    def test_create_delivery_log_params(self):
        import inspect
        from app.repositories.webhook_repository import WebhookRepository
        sig = inspect.signature(WebhookRepository.create_delivery_log)
        params = sig.parameters
        assert "endpoint_id" in params
        assert "event_type" in params
        assert "payload" in params
        assert "is_success" in params


# ─── Service wiring tests ─────────────────────────────────────────────────────

class TestWebhookServiceWiring:
    def test_service_methods_exist(self):
        """Ensure all route-facing methods are present on WebhookService."""
        from app.services.webhook_services import WebhookService
        for method in [
            "create_endpoint",
            "list_endpoints",
            "get_endpoint",
            "update_endpoint",
            "delete_endpoint",
            "test_endpoint",
            "list_deliveries",
        ]:
            assert hasattr(WebhookService, method), f"Missing method: {method}"

    def test_encrypt_decrypt_roundtrip(self):
        """Verify Fernet encrypt/decrypt works with a test key."""
        from cryptography.fernet import Fernet
        from app.services.webhook_services import WebhookService

        test_key = Fernet.generate_key().decode()
        service = object.__new__(WebhookService)
        service._fernet = Fernet(test_key.encode())

        secret = "whsec_testvalue"
        encrypted = service._encrypt(secret)
        decrypted = service._decrypt(encrypted)
        assert decrypted == secret

    def test_service_imports_work(self):
        from app.services.webhook_services import WebhookService
        assert WebhookService is not None


# ─── Router import test ───────────────────────────────────────────────────────

class TestWebhookRouterImports:
    def test_router_importable(self):
        from app.api.v1.webhooks import router
        assert router is not None

    def test_webhook_not_found_exception_in_router_module(self):
        """The router module must have WebhookNotFoundException in its namespace."""
        import app.api.v1.webhooks as wh_module
        assert hasattr(wh_module, "WebhookNotFoundException")

    def test_exception_class_correct(self):
        from app.exceptions.webhook import WebhookNotFoundException
        exc = WebhookNotFoundException()
        assert str(exc) == "Webhook endpoint not found."
        exc2 = WebhookNotFoundException("Custom message")
        assert str(exc2) == "Custom message"


# ─── Dispatcher tests ─────────────────────────────────────────────────────────

class TestWebhookDispatcher:
    @pytest.mark.asyncio
    async def test_send_once_success(self, monkeypatch):
        import httpx
        from app.services.webhook_dispatcher import WebhookDispatcher

        class MockResponse:
            status_code = 200
            text = '{"received": true}'

        async def mock_post(*args, **kwargs):
            return MockResponse()

        monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

        dispatcher = WebhookDispatcher()
        result = await dispatcher.send_once(
            url="https://example.com/webhook",
            secret="whsec_testsecret123",
            payload={"event": "ping", "data": "hello"},
        )

        assert result["success"] is True
        assert result["status_code"] == 200
        assert result["response_body"] == '{"received": true}'
        assert result["message"] == "Delivery successful."
        assert isinstance(result["duration_ms"], int)

    @pytest.mark.asyncio
    async def test_send_once_non_2xx(self, monkeypatch):
        import httpx
        from app.services.webhook_dispatcher import WebhookDispatcher

        class MockResponse:
            status_code = 500
            text = "Internal Server Error"

        async def mock_post(*args, **kwargs):
            return MockResponse()

        monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

        dispatcher = WebhookDispatcher()
        result = await dispatcher.send_once(
            url="https://example.com/webhook",
            secret="whsec_testsecret123",
            payload={"event": "ping"},
        )

        assert result["success"] is False
        assert result["status_code"] == 500
        assert result["response_body"] == "Internal Server Error"
        assert "500" in result["message"]

    @pytest.mark.asyncio
    async def test_send_once_timeout(self, monkeypatch):
        import httpx
        from app.services.webhook_dispatcher import WebhookDispatcher

        async def mock_post(*args, **kwargs):
            raise httpx.TimeoutException("Timeout")

        monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

        dispatcher = WebhookDispatcher()
        result = await dispatcher.send_once(
            url="https://example.com/webhook",
            secret="whsec_testsecret123",
            payload={"event": "ping"},
        )

        assert result["success"] is False
        assert result["status_code"] is None
        assert result["response_body"] is None
        assert "timed out" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_send_once_network_error(self, monkeypatch):
        import httpx
        from app.services.webhook_dispatcher import WebhookDispatcher

        async def mock_post(*args, **kwargs):
            raise httpx.ConnectError("Connection refused")

        monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

        dispatcher = WebhookDispatcher()
        result = await dispatcher.send_once(
            url="https://example.com/webhook",
            secret="whsec_testsecret123",
            payload={"event": "ping"},
        )

        assert result["success"] is False
        assert result["status_code"] is None
        assert "Network error" in result["message"]

    @pytest.mark.asyncio
    async def test_dispatch_event_success(self, monkeypatch):
        from uuid import uuid4
        from cryptography.fernet import Fernet
        import httpx
        from app.services.webhook_dispatcher import WebhookDispatcher
        from app.core.config import settings

        test_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "webhook_encryption_key", test_key)
        fernet = Fernet(test_key.encode())

        org_id = uuid4()
        endpoint_id = uuid4()
        secret_enc = fernet.encrypt(b"whsec_dispatcher_test").decode()

        mock_endpoint = type("MockEndpoint", (), {
            "id": endpoint_id,
            "url": "https://example.com/hook",
            "secret_encrypted": secret_enc,
            "is_active": True,
            "consecutive_failures": 0,
        })()

        delivery_logged = []
        reset_called = []

        class MockRepo:
            def __init__(self, session):
                pass
            async def get_active_endpoints_for_event(self, *, organization_id, event_type):
                return [mock_endpoint]
            async def create_delivery_log(self, **kwargs):
                delivery_logged.append(kwargs)
            async def reset_failures(self, *, endpoint):
                reset_called.append(endpoint)
            async def increment_failure(self, *, endpoint):
                pass

        class MockSession:
            async def commit(self):
                pass

        async def mock_get_db():
            yield MockSession()

        class MockResponse:
            status_code = 200
            text = "ok"

        async def mock_post(*args, **kwargs):
            return MockResponse()

        monkeypatch.setattr("app.services.webhook_dispatcher.get_db", mock_get_db)
        monkeypatch.setattr("app.services.webhook_dispatcher.WebhookRepository", MockRepo)
        monkeypatch.setattr(httpx.AsyncClient, "post", mock_post)

        dispatcher = WebhookDispatcher()
        await dispatcher.dispatch_event(
            organization_id=org_id,
            event_type="ticket.created",
            data={"ticket_id": str(uuid4())},
        )

        assert len(delivery_logged) == 1
        assert delivery_logged[0]["is_success"] is True
        assert len(reset_called) == 1

    @pytest.mark.asyncio
    async def test_dispatch_event_no_endpoints(self, monkeypatch):
        from uuid import uuid4
        from app.services.webhook_dispatcher import WebhookDispatcher

        class MockRepo:
            def __init__(self, session):
                pass
            async def get_active_endpoints_for_event(self, *, organization_id, event_type):
                return []

        class MockSession:
            async def commit(self):
                pass

        async def mock_get_db():
            yield MockSession()

        monkeypatch.setattr("app.services.webhook_dispatcher.get_db", mock_get_db)
        monkeypatch.setattr("app.services.webhook_dispatcher.WebhookRepository", MockRepo)

        dispatcher = WebhookDispatcher()
        # Should complete cleanly without error
        await dispatcher.dispatch_event(
            organization_id=uuid4(),
            event_type="ticket.created",
            data={},
        )


# ─── Repository Logic tests ───────────────────────────────────────────────────

class TestWebhookRepositoryLogic:
    @pytest.mark.asyncio
    async def test_increment_failure_threshold_disables(self):
        from app.repositories.webhook_repository import WebhookRepository

        class MockSession:
            async def flush(self):
                pass

        class MockEndpoint:
            consecutive_failures = 49
            is_active = True

        repo = WebhookRepository(MockSession())
        endpoint = MockEndpoint()

        await repo.increment_failure(endpoint=endpoint)
        assert endpoint.consecutive_failures == 50
        assert endpoint.is_active is False

    @pytest.mark.asyncio
    async def test_reset_failures(self):
        from app.repositories.webhook_repository import WebhookRepository

        class MockSession:
            async def flush(self):
                pass

        class MockEndpoint:
            consecutive_failures = 15

        repo = WebhookRepository(MockSession())
        endpoint = MockEndpoint()

        await repo.reset_failures(endpoint=endpoint)
        assert endpoint.consecutive_failures == 0

    @pytest.mark.asyncio
    async def test_get_active_endpoints_for_event_matching(self):
        from uuid import uuid4
        from app.repositories.webhook_repository import WebhookRepository

        class MockEndpoint:
            def __init__(self, is_active, events):
                self.is_active = is_active
                self.subscribed_events = events

        ep_wildcard = MockEndpoint(True, ["*"])
        ep_specific = MockEndpoint(True, ["ticket.created"])
        ep_other = MockEndpoint(True, ["ticket.resolved"])
        ep_inactive = MockEndpoint(False, ["ticket.created"])

        class MockRepo(WebhookRepository):
            def __init__(self):
                pass
            async def list_endpoints(self, *, organization_id):
                return [ep_wildcard, ep_specific, ep_other, ep_inactive]

        repo = MockRepo()
        matched = await repo.get_active_endpoints_for_event(
            organization_id=uuid4(),
            event_type="ticket.created",
        )

        assert ep_wildcard in matched
        assert ep_specific in matched
        assert ep_other not in matched
        assert ep_inactive not in matched


# ─── Service Business Logic tests ─────────────────────────────────────────────

class TestWebhookServiceLogic:
    @pytest.mark.asyncio
    async def test_create_endpoint_checks_owner(self, monkeypatch):
        from uuid import uuid4
        from cryptography.fernet import Fernet
        from app.core.config import settings
        from app.services.webhook_services import WebhookService
        from app.exceptions.auth import PermissionDeniedException

        monkeypatch.setattr(settings, "webhook_encryption_key", Fernet.generate_key().decode())

        class MockSession:
            pass

        service = WebhookService(MockSession())

        async def mock_require_owner(*args, **kwargs):
            raise PermissionDeniedException()

        monkeypatch.setattr(service, "_require_owner", mock_require_owner)

        user = type("MockUser", (), {"id": uuid4()})()
        with pytest.raises(PermissionDeniedException):
            await service.create_endpoint(
                organization_id=uuid4(),
                current_user=user,
                name="Test",
                url="https://example.com",
                subscribed_events=["*"],
            )

    @pytest.mark.asyncio
    async def test_get_endpoint_not_found_raises(self, monkeypatch):
        from uuid import uuid4
        from cryptography.fernet import Fernet
        from app.core.config import settings
        from app.services.webhook_services import WebhookService
        from app.exceptions.webhook import WebhookNotFoundException

        monkeypatch.setattr(settings, "webhook_encryption_key", Fernet.generate_key().decode())

        class MockRepo:
            async def get_endpoint_by_id(self, **kwargs):
                return None

        class MockSession:
            pass

        service = WebhookService(MockSession())
        service.webhook_repository = MockRepo()

        async def mock_require_member(*args, **kwargs):
            pass

        monkeypatch.setattr(service, "_require_member", mock_require_member)

        user = type("MockUser", (), {"id": uuid4()})()
        with pytest.raises(WebhookNotFoundException):
            await service.get_endpoint(
                organization_id=uuid4(),
                endpoint_id=uuid4(),
                current_user=user,
            )

    @pytest.mark.asyncio
    async def test_test_endpoint_success(self, monkeypatch):
        from uuid import uuid4
        from cryptography.fernet import Fernet
        from app.core.config import settings
        from app.services.webhook_services import WebhookService

        test_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "webhook_encryption_key", test_key)
        fernet = Fernet(test_key.encode())

        raw_sec = "whsec_test_ping_secret"
        enc_sec = fernet.encrypt(raw_sec.encode()).decode()

        mock_endpoint = type("MockEndpoint", (), {
            "id": uuid4(),
            "url": "https://example.com/hook",
            "secret_encrypted": enc_sec,
        })()

        class MockSession:
            pass

        service = WebhookService(MockSession())

        async def mock_get_endpoint(*args, **kwargs):
            return mock_endpoint

        monkeypatch.setattr(service, "get_endpoint", mock_get_endpoint)

        async def mock_send_once(self, *, url, secret, payload):
            assert url == "https://example.com/hook"
            assert secret == raw_sec
            assert payload["event"] == "ping"
            return {
                "success": True,
                "status_code": 200,
                "response_body": "pong",
                "duration_ms": 50,
                "message": "Delivery successful.",
            }

        monkeypatch.setattr("app.services.webhook_dispatcher.WebhookDispatcher.send_once", mock_send_once)

        user = type("MockUser", (), {"id": uuid4()})()
        result = await service.test_endpoint(
            organization_id=uuid4(),
            endpoint_id=mock_endpoint.id,
            current_user=user,
        )

        assert result["success"] is True
        assert result["status_code"] == 200


# ─── API Router tests ─────────────────────────────────────────────────────────

class TestWebhookApiRoutes:
    @pytest.mark.asyncio
    async def test_api_routes_structure(self):
        from app.api.v1.webhooks import router
        route_paths = [r.path for r in router.routes]
        prefix = "/organizations/{organization_id}/webhooks"

        assert prefix in route_paths
        assert f"{prefix}/{{endpoint_id}}" in route_paths
        assert f"{prefix}/{{endpoint_id}}/test" in route_paths
        assert f"{prefix}/{{endpoint_id}}/deliveries" in route_paths

    @pytest.mark.asyncio
    async def test_create_webhook_route(self, monkeypatch):
        from uuid import uuid4
        from datetime import datetime, UTC
        from httpx import AsyncClient, ASGITransport
        from app.main import app
        from app.db.dependencies import get_db
        from app.dependencies.auth import get_current_user
        from app.models.user import User

        org_id = uuid4()
        user_id = uuid4()
        mock_user = User(id=user_id, email="test@example.com", hashed_password="pw", is_active=True)

        class MockSession:
            pass

        async def override_get_db():
            yield MockSession()

        async def override_get_user():
            return mock_user

        mock_endpoint = type("MockEndpoint", (), {
            "id": uuid4(),
            "name": "Slack Hook",
            "url": "https://hooks.slack.com/services/xxx",
            "subscribed_events": ["ticket.created"],
            "is_active": True,
            "created_at": datetime.now(UTC),
        })()

        async def mock_create_endpoint(self, **kwargs):
            return mock_endpoint, "whsec_sample_secret_12345"

        monkeypatch.setattr("app.services.webhook_services.WebhookService.create_endpoint", mock_create_endpoint)

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_user

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.post(
                    f"/api/v1/organizations/{org_id}/webhooks",
                    json={
                        "name": "Slack Hook",
                        "url": "https://hooks.slack.com/services/xxx",
                        "subscribed_events": ["ticket.created"],
                    },
                )
                assert res.status_code == 201
                data = res.json()
                assert data["name"] == "Slack Hook"
                assert data["secret"] == "whsec_sample_secret_12345"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_create_webhook_validation_error_422(self):
        from uuid import uuid4
        from httpx import AsyncClient, ASGITransport
        from app.main import app
        from app.db.dependencies import get_db
        from app.dependencies.auth import get_current_user
        from app.models.user import User

        org_id = uuid4()
        mock_user = User(id=uuid4(), email="test@example.com", hashed_password="pw", is_active=True)

        async def override_get_db():
            yield None

        async def override_get_user():
            return mock_user

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_user

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Invalid URL (not http/https)
                res = await client.post(
                    f"/api/v1/organizations/{org_id}/webhooks",
                    json={
                        "name": "Bad Hook",
                        "url": "ftp://example.com",
                        "subscribed_events": ["*"],
                    },
                )
                assert res.status_code == 422

                # Empty events
                res2 = await client.post(
                    f"/api/v1/organizations/{org_id}/webhooks",
                    json={
                        "name": "Bad Hook",
                        "url": "https://example.com",
                        "subscribed_events": [],
                    },
                )
                assert res2.status_code == 422
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_webhook_404_handled(self, monkeypatch):
        from uuid import uuid4
        from httpx import AsyncClient, ASGITransport
        from app.main import app
        from app.db.dependencies import get_db
        from app.dependencies.auth import get_current_user
        from app.models.user import User
        from app.exceptions.webhook import WebhookNotFoundException

        org_id = uuid4()
        ep_id = uuid4()
        mock_user = User(id=uuid4(), email="test@example.com", hashed_password="pw", is_active=True)

        async def override_get_db():
            yield None

        async def override_get_user():
            return mock_user

        async def mock_get_endpoint(self, **kwargs):
            raise WebhookNotFoundException()

        monkeypatch.setattr("app.services.webhook_services.WebhookService.get_endpoint", mock_get_endpoint)

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_user] = override_get_user

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get(f"/api/v1/organizations/{org_id}/webhooks/{ep_id}")
                assert res.status_code == 404
        finally:
            app.dependency_overrides.clear()

