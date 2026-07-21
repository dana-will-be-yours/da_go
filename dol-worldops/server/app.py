from __future__ import annotations

from worldops.app_factory import create_worldops_app
from worldops.models import SessionRecord
from worldops.service import WorldOpsCommandService, register_default_commands
from worldops.store import InMemoryWorldOpsStore

store = InMemoryWorldOpsStore()
store.create_room(
    "DEMO-ROOM",
    schema_version="1",
    initial_state={
        "active_scene_id": "DEMO-SCENE",
        "messages": [],
        "tokens": {},
    },
)
store.register_session(
    SessionRecord(
        session_id="DEMO-GM-SESSION",
        room_id="DEMO-ROOM",
        actor_member_id="DEMO-GM",
        capabilities=frozenset({
            "chat.send",
            "map.token.move",
            "room.manage",
            "room.read",
            "snapshot.request",
        }),
    )
)

service = WorldOpsCommandService(store)
register_default_commands(service)
app = create_worldops_app(service)
