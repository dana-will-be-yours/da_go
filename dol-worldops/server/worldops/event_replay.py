from __future__ import annotations

from collections.abc import Callable, Iterable
from copy import deepcopy
from dataclasses import dataclass
from typing import Any

from .canonical import sha256_hex
from .schema_migration import MigrationReceipt, SchemaMigrationRegistry


class EventReplayError(ValueError):
    def __init__(self, code: str, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


EventReducer = Callable[[dict[str, Any], dict[str, Any]], dict[str, Any]]


@dataclass(frozen=True)
class ReplayReceipt:
    room_id: str
    snapshot_id: str
    source_version: int
    target_version: int
    event_count: int
    schema_version: str
    state_hash: str
    migration: MigrationReceipt | None
    formal_runtime_allowed: bool = False
    canon_write_allowed: bool = False


class WorldOpsEventReplayer:
    def __init__(
        self,
        reducers: dict[str, EventReducer],
        *,
        migration_registry: SchemaMigrationRegistry | None = None,
    ) -> None:
        if not isinstance(reducers, dict) or any(not isinstance(key, str) or not callable(fn) for key, fn in reducers.items()):
            raise EventReplayError("INVALID_REDUCER_REGISTRY", "reducers must map event types to callables")
        self.reducers = dict(reducers)
        self.migration_registry = migration_registry

    @staticmethod
    def _dump(value: Any) -> dict[str, Any]:
        if hasattr(value, "model_dump"):
            dumped = value.model_dump(mode="json")
        elif isinstance(value, dict):
            dumped = deepcopy(value)
        else:
            raise EventReplayError("INVALID_REPLAY_RECORD", "snapshot and events must be dictionaries or Pydantic models")
        if not isinstance(dumped, dict):
            raise EventReplayError("INVALID_REPLAY_RECORD", "record dump must be a dictionary")
        return dumped

    def rebuild(
        self,
        snapshot: Any,
        events: Iterable[Any],
        *,
        target_schema_version: str | None = None,
    ) -> tuple[dict[str, Any], ReplayReceipt]:
        base = self._dump(snapshot)
        required = {"snapshot_id", "room_id", "room_version", "schema_version", "state", "state_hash", "authoritative"}
        missing = sorted(required - base.keys())
        if missing:
            raise EventReplayError("SNAPSHOT_FIELDS_MISSING", "snapshot is missing required fields", details={"missing": missing})
        if base["authoritative"] is not True:
            raise EventReplayError("UNTRUSTED_SNAPSHOT", "snapshot must be server-authoritative")
        if not isinstance(base["state"], dict):
            raise EventReplayError("INVALID_SNAPSHOT_STATE", "snapshot state must be a dictionary")
        if sha256_hex(base["state"]) != base["state_hash"]:
            raise EventReplayError("SNAPSHOT_HASH_MISMATCH", "snapshot state hash does not match its body")

        room_id = str(base["room_id"])
        version = int(base["room_version"])
        state = deepcopy(base["state"])
        event_rows = [self._dump(event) for event in events]
        event_rows.sort(key=lambda row: int(row["room_version"]))
        seen_versions: set[int] = set()
        seen_ids: set[str] = set()

        for row in event_rows:
            event_id = str(row.get("event_id", ""))
            event_version = int(row.get("room_version", -1))
            if not event_id or event_id in seen_ids:
                raise EventReplayError("DUPLICATE_EVENT_ID", "event ids must be non-empty and unique", details={"event_id": event_id})
            if event_version in seen_versions:
                raise EventReplayError("DUPLICATE_EVENT_VERSION", "event versions must be unique", details={"room_version": event_version})
            seen_ids.add(event_id)
            seen_versions.add(event_version)
            if str(row.get("room_id")) != room_id:
                raise EventReplayError("EVENT_ROOM_MISMATCH", "event belongs to a different room", details={"event_id": event_id})
            if event_version != version + 1:
                raise EventReplayError(
                    "EVENT_SEQUENCE_GAP",
                    "event sequence is not contiguous",
                    details={"expected_version": version + 1, "actual_version": event_version},
                )
            payload = row.get("payload")
            if not isinstance(payload, dict):
                raise EventReplayError("INVALID_EVENT_PAYLOAD", "event payload must be a dictionary", details={"event_id": event_id})
            if sha256_hex(payload) != row.get("payload_hash"):
                raise EventReplayError("EVENT_HASH_MISMATCH", "event payload hash mismatch", details={"event_id": event_id})
            event_type = str(row.get("event_type", ""))
            reducer = self.reducers.get(event_type)
            if reducer is None:
                raise EventReplayError("EVENT_REDUCER_NOT_FOUND", f"no reducer is registered for {event_type}")
            next_state = reducer(deepcopy(state), deepcopy(payload))
            if not isinstance(next_state, dict):
                raise EventReplayError("INVALID_REDUCER_RESULT", f"reducer {event_type} did not return a dictionary")
            state = deepcopy(next_state)
            version = event_version

        schema_version = str(base["schema_version"])
        migration_receipt = None
        if target_schema_version is not None and target_schema_version != schema_version:
            if self.migration_registry is None:
                raise EventReplayError("MIGRATION_REGISTRY_REQUIRED", "target schema differs but no migration registry was provided")
            state, migration_receipt = self.migration_registry.migrate(state, schema_version, target_schema_version)
            schema_version = target_schema_version

        receipt = ReplayReceipt(
            room_id=room_id,
            snapshot_id=str(base["snapshot_id"]),
            source_version=int(base["room_version"]),
            target_version=version,
            event_count=len(event_rows),
            schema_version=schema_version,
            state_hash=sha256_hex(state),
            migration=migration_receipt,
        )
        return state, receipt
