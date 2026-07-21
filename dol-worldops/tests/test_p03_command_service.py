from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from worldops.app_factory import create_worldops_app
from worldops.models import CommandEnvelope, SessionRecord
from worldops.service import WorldOpsCommandService, register_default_commands
from worldops.store import InMemoryWorldOpsStore


def make_store() -> tuple[InMemoryWorldOpsStore, WorldOpsCommandService]:
    store = InMemoryWorldOpsStore()
    store.create_room(
        "ROOM-1",
        schema_version="1",
        initial_state={"messages": [], "tokens": {}, "active_scene_id": "SCENE-0"},
    )
    store.register_session(
        SessionRecord(
            session_id="SESSION-GM",
            room_id="ROOM-1",
            actor_member_id="GM-1",
            capabilities=frozenset({
                "chat.send",
                "map.token.move",
                "room.manage",
                "room.read",
                "snapshot.request",
            }),
        )
    )
    store.register_session(
        SessionRecord(
            session_id="SESSION-PLAYER",
            room_id="ROOM-1",
            actor_member_id="PL-1",
            capabilities=frozenset({"chat.send", "room.read"}),
        )
    )
    store.register_session(
        SessionRecord(
            session_id="SESSION-REVOKED",
            room_id="ROOM-1",
            actor_member_id="PL-2",
            capabilities=frozenset({"chat.send", "room.read"}),
            status="revoked",
        )
    )
    service = WorldOpsCommandService(store)
    register_default_commands(service)
    return store, service


def command(
    *,
    command_id: str | None = None,
    idempotency_key: str | None = None,
    session_id: str = "SESSION-GM",
    actor_member_id: str = "GM-1",
    command_type: str = "room.message.append",
    expected_version: int = 0,
    payload: dict | None = None,
) -> CommandEnvelope:
    return CommandEnvelope(
        command_id=command_id or str(uuid4()),
        idempotency_key=idempotency_key or str(uuid4()),
        room_id="ROOM-1",
        session_id=session_id,
        actor_member_id=actor_member_id,
        command_type=command_type,
        expected_version=expected_version,
        payload=payload or {"text": "陽月：這是一筆合成測試訊息。", "channel": "ic"},
        client_time=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_accepted_command_appends_one_event_and_increments_version() -> None:
    store, service = make_store()
    response = await service.execute(command())

    assert response.status == "accepted"
    assert response.room_version == 1
    assert response.event is not None
    assert response.event.room_version == 1
    assert response.event.event_type == "room.message.appended"
    assert store.require_room("ROOM-1").version == 1
    assert len(store.require_room("ROOM-1").events) == 1
    assert len(store.room_state_copy("ROOM-1")["messages"]) == 1
    assert response.formal_runtime_allowed is False


@pytest.mark.asyncio
async def test_same_idempotency_key_and_fingerprint_returns_duplicate_without_new_event() -> None:
    store, service = make_store()
    cid = str(uuid4())
    key = str(uuid4())
    first_command = command(command_id=cid, idempotency_key=key)

    first = await service.execute(first_command)
    duplicate = await service.execute(first_command)

    assert first.status == "accepted"
    assert duplicate.status == "duplicate"
    assert duplicate.room_version == 1
    assert duplicate.event == first.event
    assert duplicate.receipt.receipt_id != first.receipt.receipt_id
    assert duplicate.receipt.body_hash != first.receipt.body_hash
    assert len(store.require_room("ROOM-1").events) == 1


@pytest.mark.asyncio
async def test_reusing_idempotency_key_with_changed_content_is_rejected() -> None:
    store, service = make_store()
    key = str(uuid4())
    first = await service.execute(command(idempotency_key=key))
    second = await service.execute(command(idempotency_key=key, payload={"text": "不同內容", "channel": "ic"}))

    assert first.status == "accepted"
    assert second.status == "rejected"
    assert second.error_code == "IDEMPOTENCY_KEY_REUSED"
    assert store.require_room("ROOM-1").version == 1
    assert len(store.require_room("ROOM-1").events) == 1


@pytest.mark.asyncio
async def test_reusing_command_id_with_changed_content_is_rejected() -> None:
    store, service = make_store()
    cid = str(uuid4())
    first = await service.execute(command(command_id=cid))
    second = await service.execute(command(command_id=cid, payload={"text": "不同內容", "channel": "ic"}))

    assert first.status == "accepted"
    assert second.status == "rejected"
    assert second.error_code == "COMMAND_ID_REUSED"
    assert store.require_room("ROOM-1").version == 1


@pytest.mark.asyncio
async def test_expected_version_conflict_does_not_append_event() -> None:
    store, service = make_store()
    response = await service.execute(command(expected_version=9))

    assert response.status == "conflict"
    assert response.error_code == "VERSION_CONFLICT"
    assert response.current_version == 0
    assert store.require_room("ROOM-1").version == 0
    assert store.require_room("ROOM-1").events == []


@pytest.mark.asyncio
async def test_conflict_response_is_idempotent_for_same_attempt() -> None:
    store, service = make_store()
    request = command(expected_version=9)
    first = await service.execute(request)
    repeated = await service.execute(request)

    assert first.status == "conflict"
    assert repeated.status == "conflict"
    assert repeated.receipt.status == "replayed_conflict"
    assert repeated.error_code == "VERSION_CONFLICT"
    assert store.require_room("ROOM-1").version == 0


@pytest.mark.asyncio
async def test_capability_actor_and_session_guards_reject_without_event() -> None:
    store, service = make_store()
    denied = await service.execute(command(
        session_id="SESSION-PLAYER",
        actor_member_id="PL-1",
        command_type="room.token.move",
        payload={"token_id": "T-1", "x": 1, "y": 2},
    ))
    mismatch = await service.execute(command(
        session_id="SESSION-PLAYER",
        actor_member_id="GM-1",
    ))
    revoked = await service.execute(command(
        session_id="SESSION-REVOKED",
        actor_member_id="PL-2",
    ))

    assert denied.error_code == "CAPABILITY_DENIED"
    assert mismatch.error_code == "SESSION_ACTOR_MISMATCH"
    assert revoked.error_code == "SESSION_INVALID"
    assert store.require_room("ROOM-1").events == []


@pytest.mark.asyncio
async def test_command_validation_rejection_is_idempotent() -> None:
    store, service = make_store()
    request = command(payload={"text": "", "channel": "ic"})
    first = await service.execute(request)
    repeated = await service.execute(request)

    assert first.status == "rejected"
    assert first.error_code == "COMMAND_VALIDATION_FAILED"
    assert repeated.status == "rejected"
    assert repeated.receipt.status == "replayed_rejected"
    assert repeated.error_code == "COMMAND_VALIDATION_FAILED"
    assert store.require_room("ROOM-1").events == []


@pytest.mark.asyncio
async def test_sync_replays_only_events_after_cursor() -> None:
    store, service = make_store()
    await service.execute(command(expected_version=0, payload={"text": "one", "channel": "ic"}))
    await service.execute(command(expected_version=1, payload={"text": "two", "channel": "ooc"}))

    sync = service.sync("ROOM-1", after_version=1)

    assert sync.current_version == 2
    assert sync.next_cursor == 2
    assert [event.room_version for event in sync.events] == [2]
    assert sync.formal_runtime_allowed is False


def test_snapshot_requires_capability_and_exact_room_version() -> None:
    store, service = make_store()
    initial = service.latest_snapshot("ROOM-1")
    assert initial.room_version == 0
    assert initial.authoritative is True

    with pytest.raises(PermissionError):
        service.create_snapshot("ROOM-1", "SESSION-PLAYER", 0)
    with pytest.raises(RuntimeError):
        service.create_snapshot("ROOM-1", "SESSION-GM", 1)

    snapshot = service.create_snapshot("ROOM-1", "SESSION-GM", 0)
    assert snapshot.authoritative is True
    assert snapshot.formal_runtime_allowed is False
    assert service.latest_snapshot("ROOM-1").snapshot_id == snapshot.snapshot_id


def test_fastapi_command_and_sync_contract() -> None:
    store, service = make_store()
    client = TestClient(create_worldops_app(service))
    request = command()

    missing_header = client.post("/api/worldops/rooms/ROOM-1/commands", json=request.model_dump(mode="json"))
    assert missing_header.status_code == 403
    assert missing_header.json()["error_code"] == "SESSION_HEADER_MISMATCH"

    accepted = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json=request.model_dump(mode="json"),
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    duplicate = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json=request.model_dump(mode="json"),
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["status"] == "duplicate"

    sync = client.get(
        "/api/worldops/rooms/ROOM-1/events?after_version=0",
        headers={"X-WorldOps-Session": "SESSION-PLAYER"},
    )
    assert sync.status_code == 200
    assert sync.json()["next_cursor"] == 1
    assert len(sync.json()["events"]) == 1
    assert store.get_sync_cursor("SESSION-PLAYER", "ROOM-1") == 1


def test_fastapi_maps_conflict_capability_and_validation_errors() -> None:
    _, service = make_store()
    client = TestClient(create_worldops_app(service))

    conflict = command(expected_version=4)
    conflict_response = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json=conflict.model_dump(mode="json"),
    )
    assert conflict_response.status_code == 409
    assert conflict_response.json()["error_code"] == "VERSION_CONFLICT"

    denied = command(
        session_id="SESSION-PLAYER",
        actor_member_id="PL-1",
        command_type="room.token.move",
        payload={"token_id": "T-1", "x": 10, "y": 12},
    )
    denied_response = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-PLAYER"},
        json=denied.model_dump(mode="json"),
    )
    assert denied_response.status_code == 403
    assert denied_response.json()["error_code"] == "CAPABILITY_DENIED"

    invalid = command(payload={"text": "", "channel": "ic"})
    invalid_response = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json=invalid.model_dump(mode="json"),
    )
    assert invalid_response.status_code == 422
    assert invalid_response.json()["error_code"] == "COMMAND_VALIDATION_FAILED"


def test_fastapi_snapshot_request_and_read_contract() -> None:
    _, service = make_store()
    client = TestClient(create_worldops_app(service))

    unauthorized = client.post(
        "/api/worldops/rooms/ROOM-1/snapshot-requests",
        headers={"X-WorldOps-Session": "SESSION-PLAYER"},
        json={"expected_version": 0},
    )
    assert unauthorized.status_code == 403

    created = client.post(
        "/api/worldops/rooms/ROOM-1/snapshot-requests",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json={"expected_version": 0},
    )
    assert created.status_code == 201
    assert created.json()["authoritative"] is True
    assert created.json()["formal_runtime_allowed"] is False

    latest = client.get(
        "/api/worldops/rooms/ROOM-1/snapshot",
        headers={"X-WorldOps-Session": "SESSION-PLAYER"},
    )
    assert latest.status_code == 200
    assert latest.json()["snapshot_id"] == created.json()["snapshot_id"]


def test_websocket_backlog_uses_room_version_as_reconnect_cursor() -> None:
    _, service = make_store()
    client = TestClient(create_worldops_app(service))
    first = command(expected_version=0)
    response = client.post(
        "/api/worldops/rooms/ROOM-1/commands",
        headers={"X-WorldOps-Session": "SESSION-GM"},
        json=first.model_dump(mode="json"),
    )
    assert response.status_code == 200

    with client.websocket_connect(
        "/ws/worldops/rooms/ROOM-1?session_id=SESSION-PLAYER&after_version=0"
    ) as websocket:
        sync = websocket.receive_json()
        assert sync["type"] == "sync"
        assert sync["next_cursor"] == 1
        assert len(sync["events"]) == 1


def test_health_endpoint_keeps_formal_runtime_disabled() -> None:
    _, service = make_store()
    response = TestClient(create_worldops_app(service)).get("/api/worldops/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "component": "worldops-authoritative-command-contract",
        "formal_runtime_allowed": False,
        "canon_write_allowed": False,
        "client_cache_authoritative": False,
    }
