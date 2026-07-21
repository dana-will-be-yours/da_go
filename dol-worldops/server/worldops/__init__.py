"""DaGo × TRPG WorldOps server-authoritative runtime contracts."""

from .app_factory import create_worldops_app
from .p04_app_factory import create_worldops_p04_app
from .event_replay import EventReplayError, ReplayReceipt, WorldOpsEventReplayer
from .handoff import HandoffError, WorldOpsHandoffService
from .models import CommandEnvelope, CommandResponse, EventRecord, OperationReceipt, RoomSnapshot
from .p04_runtime import install_p04_runtime
from .reconnect import ReconnectError, ReconnectPlan, WorldOpsReconnectService
from .schema_migration import MigrationReceipt, SchemaMigrationError, SchemaMigrationRegistry
from .service import WorldOpsCommandService, register_default_commands
from .store import InMemoryWorldOpsStore

__all__ = [
    "CommandEnvelope",
    "CommandResponse",
    "EventRecord",
    "EventReplayError",
    "HandoffError",
    "InMemoryWorldOpsStore",
    "MigrationReceipt",
    "OperationReceipt",
    "ReconnectError",
    "ReconnectPlan",
    "ReplayReceipt",
    "RoomSnapshot",
    "SchemaMigrationError",
    "SchemaMigrationRegistry",
    "WorldOpsCommandService",
    "WorldOpsEventReplayer",
    "WorldOpsHandoffService",
    "WorldOpsReconnectService",
    "create_worldops_app",
    "create_worldops_p04_app",
    "install_p04_runtime",
    "register_default_commands",
]
