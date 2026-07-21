from __future__ import annotations

from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from worldops.models import SessionRecord
from worldops.p04_runtime import install_p04_runtime


class FakeStore:
    def __init__(self) -> None:
        self.room = SimpleNamespace(version=3)
        self.session = SessionRecord(
            session_id="SESSION-1",
            credential_hash="0" * 64,
            room_id="ROOM-1",
            actor_member_id="MEMBER-1",
            capabilities=frozenset({"room.read"}),
        )

    def get_session(self, session_id: str):
        return self.session if session_id == self.session.session_id else None

    def require_room(self, room_id: str):
        if room_id != "ROOM-1":
            raise KeyError(room_id)
        return self.room

    def events_after(self, room_id: str, cursor: int):
        return []


class FakeService:
    def __init__(self) -> None:
        self.store = FakeStore()

    def latest_snapshot(self, room_id: str):
        return {"snapshot_id": "SNAP-3", "room_version": 3}


def test_install_p04_runtime_registers_services_and_routes() -> None:
    app = FastAPI()
    handoffs, reconnect = install_p04_runtime(app, FakeService(), max_event_window=20, snapshot_threshold=100)
    assert app.state.worldops_handoff_service is handoffs
    assert app.state.worldops_reconnect_service is reconnect
    assert app.state.worldops_p04_formal_runtime_allowed is False
    paths = {route.path for route in app.routes}
    assert "/api/worldops/rooms/{room_id}/handoffs" in paths
    assert "/api/worldops/rooms/{room_id}/reconnect-plans" in paths

    client = TestClient(app)
    plan = client.post(
        "/api/worldops/rooms/ROOM-1/reconnect-plans",
        headers={"X-WorldOps-Session": "SESSION-1"},
        json={"cursor": 3},
    )
    assert plan.status_code == 200
    assert plan.json()["next_cursor"] == 3
    assert plan.json()["formal_runtime_allowed"] is False


def test_install_p04_runtime_rejects_incompatible_p03_service() -> None:
    app = FastAPI()
    try:
        install_p04_runtime(app, object())
    except TypeError as error:
        assert "store" in str(error)
    else:
        raise AssertionError("incompatible service must be rejected")
