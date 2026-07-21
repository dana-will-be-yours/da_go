from worldops.p04_app_factory import create_worldops_p04_app
from worldops.models import SessionRecord
from worldops.service import WorldOpsCommandService, register_default_commands
from worldops.store import InMemoryWorldOpsStore

store = InMemoryWorldOpsStore()
store.create_room(
    "DEMO-ROOM",
    schema_version="1",
    initial_state={
        "messages": [],
        "tokens": {},
        "active_scene_id": None,
    },
)
store.register_session(
    SessionRecord(
        session_id="DEMO-SESSION",
        room_id="DEMO-ROOM",
        actor_member_id="DEMO-MEMBER",
        capabilities=frozenset(
            {
                "room.command",
                "room.read",
                "snapshot.request",
            }
        ),
    )
)
service = WorldOpsCommandService(store)
register_default_commands(service)
app = create_worldops_p04_app(service)
