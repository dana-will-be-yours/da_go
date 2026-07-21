from __future__ import annotations

from types import SimpleNamespace

from worldops.models import SessionRecord
from worldops.p04_app_factory import create_worldops_p04_app


class Store:
    def __init__(self) -> None:
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
        return SimpleNamespace(version=0)

    def events_after(self, room_id: str, cursor: int):
        return []


class Service:
    def __init__(self) -> None:
        self.store = Store()

    def latest_snapshot(self, room_id: str):
        return {"snapshot_id": "S0", "room_version": 0}


def test_p04_app_factory_wraps_p03_application_without_enabling_formal_runtime() -> None:
    service = Service()
    app = create_worldops_p04_app(service)
    assert app.version == "0.4.0"
    assert app.state.worldops_runtime_version == "0.4.0"
    assert app.state.worldops_formal_runtime_allowed is False
    assert app.state.worldops_p04_formal_runtime_allowed is False
    paths = {route.path for route in app.routes}
    assert "/api/worldops/rooms/{room_id}/handoffs" in paths
    assert "/api/worldops/rooms/{room_id}/reconnect-plans" in paths
