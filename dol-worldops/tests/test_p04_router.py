from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from worldops.handoff import WorldOpsHandoffService
from worldops.models import SessionRecord
from worldops.p04_router import create_p04_router
from worldops.reconnect import WorldOpsReconnectService


def build_client() -> tuple[TestClient, list[dict]]:
    session = SessionRecord(
        session_id="SESSION-1",
        credential_hash="0" * 64,
        room_id="ROOM-1",
        actor_member_id="MEMBER-1",
        capabilities=frozenset({"room.read"}),
    )
    sessions = {session.session_id: session}
    events = [
        {"room_version": 1, "event_id": "E1"},
        {"room_version": 2, "event_id": "E2"},
        {"room_version": 3, "event_id": "E3"},
    ]
    handoffs = WorldOpsHandoffService(token_factory=lambda: "T" * 48, id_factory=lambda: "HANDOFF-1")
    reconnect = WorldOpsReconnectService(
        current_version=lambda room_id: 3,
        events_after=lambda room_id, cursor: [event for event in events if event["room_version"] > cursor],
        latest_snapshot=lambda room_id: {"snapshot_id": "SNAP-2", "room_version": 2},
        event_version=lambda event: int(event["room_version"]),
        max_event_window=2,
        snapshot_threshold=10,
    )
    app = FastAPI()
    app.include_router(
        create_p04_router(
            handoffs=handoffs,
            reconnect=reconnect,
            resolve_session=sessions.get,
        )
    )
    return TestClient(app), events


def test_handoff_issue_and_consume_are_single_use() -> None:
    client, _ = build_client()
    issued = client.post(
        "/api/worldops/rooms/ROOM-1/handoffs",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={
            "source_device_id": "DESKTOP-1",
            "target_device_class": "mobile",
            "cursor": 2,
            "ttl_seconds": 120,
        },
    )
    assert issued.status_code == 201
    body = issued.json()
    assert body["handoff_token"] == "T" * 48
    assert body["formal_runtime_allowed"] is False

    consumed = client.post(
        "/api/worldops/handoffs/consume",
        json={
            "handoff_token": body["handoff_token"],
            "room_id": "ROOM-1",
            "session_id": "SESSION-1",
            "target_device_id": "PHONE-1",
            "target_device_class": "mobile",
        },
    )
    assert consumed.status_code == 200
    assert consumed.json()["status"] == "consumed"

    reused = client.post(
        "/api/worldops/handoffs/consume",
        json={
            "handoff_token": body["handoff_token"],
            "room_id": "ROOM-1",
            "session_id": "SESSION-1",
            "target_device_id": "PHONE-2",
            "target_device_class": "mobile",
        },
    )
    assert reused.status_code == 409
    assert reused.json()["error_code"] == "HANDOFF_ALREADY_USED"


def test_handoff_requires_active_bound_session_and_rejects_cursor_ahead() -> None:
    client, _ = build_client()
    missing = client.post(
        "/api/worldops/rooms/ROOM-1/handoffs",
        json={"source_device_id": "D1", "target_device_class": "mobile", "cursor": 0},
    )
    assert missing.status_code == 401
    assert missing.json()["error_code"] == "SESSION_REQUIRED"

    ahead = client.post(
        "/api/worldops/rooms/ROOM-1/handoffs",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={"source_device_id": "D1", "target_device_class": "mobile", "cursor": 4},
    )
    assert ahead.status_code == 409
    assert ahead.json()["error_code"] == "HANDOFF_CURSOR_AHEAD"


def test_reconnect_plan_and_ack_use_bounded_monotonic_cursor() -> None:
    client, _ = build_client()
    plan = client.post(
        "/api/worldops/rooms/ROOM-1/reconnect-plans",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={"cursor": 0, "delivery_window": 2},
    )
    assert plan.status_code == 200
    payload = plan.json()
    assert [event["room_version"] for event in payload["events"]] == [1, 2]
    assert payload["next_cursor"] == 2
    assert payload["has_more"] is True
    assert payload["formal_runtime_allowed"] is False

    ack = client.post(
        "/api/worldops/rooms/ROOM-1/reconnect-acks",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={"cursor": 2},
    )
    assert ack.status_code == 200
    assert ack.json()["acknowledged_cursor"] == 2

    ahead = client.post(
        "/api/worldops/rooms/ROOM-1/reconnect-acks",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={"cursor": 3},
    )
    assert ahead.status_code == 409
    assert ahead.json()["error_code"] == "RECONNECT_ACK_AHEAD"
