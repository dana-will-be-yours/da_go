from __future__ import annotations

import asyncio
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any

from .models import CommandResponse, EventRecord, RoomSnapshot, SessionRecord


@dataclass
class StoredCommand:
    command_id: str
    idempotency_key: str
    fingerprint: str
    response: CommandResponse


@dataclass
class RoomAggregate:
    room_id: str
    schema_version: str
    version: int = 0
    state: dict[str, Any] = field(default_factory=dict)
    events: list[EventRecord] = field(default_factory=list)
    snapshots: list[RoomSnapshot] = field(default_factory=list)
    commands_by_id: dict[str, StoredCommand] = field(default_factory=dict)
    commands_by_idempotency: dict[str, StoredCommand] = field(default_factory=dict)


class InMemoryWorldOpsStore:
    """Reference store for contract tests. SQL Server replaces this in formal runtime."""

    def __init__(self) -> None:
        self.rooms: dict[str, RoomAggregate] = {}
        self.sessions: dict[str, SessionRecord] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self.sync_cursors: dict[tuple[str, str], int] = {}

    def create_room(
        self,
        room_id: str,
        *,
        schema_version: str = "1",
        initial_state: dict[str, Any] | None = None,
    ) -> RoomAggregate:
        if room_id in self.rooms:
            raise ValueError(f"room already exists: {room_id}")
        room = RoomAggregate(room_id=room_id, schema_version=schema_version, state=deepcopy(initial_state or {}))
        self.rooms[room_id] = room
        self._locks[room_id] = asyncio.Lock()
        return room

    def get_room(self, room_id: str) -> RoomAggregate | None:
        return self.rooms.get(room_id)

    def require_room(self, room_id: str) -> RoomAggregate:
        room = self.get_room(room_id)
        if room is None:
            raise KeyError(f"room not found: {room_id}")
        return room

    def room_lock(self, room_id: str) -> asyncio.Lock:
        self.require_room(room_id)
        return self._locks[room_id]

    def register_session(self, session: SessionRecord) -> None:
        if session.session_id in self.sessions:
            raise ValueError(f"session already exists: {session.session_id}")
        self.require_room(session.room_id)
        self.sessions[session.session_id] = session

    def get_session(self, session_id: str) -> SessionRecord | None:
        return self.sessions.get(session_id)

    def events_after(self, room_id: str, after_version: int) -> list[EventRecord]:
        room = self.require_room(room_id)
        return [event.model_copy(deep=True) for event in room.events if event.room_version > after_version]

    def latest_snapshot(self, room_id: str) -> RoomSnapshot | None:
        room = self.require_room(room_id)
        if not room.snapshots:
            return None
        return room.snapshots[-1].model_copy(deep=True)

    def room_state_copy(self, room_id: str) -> dict[str, Any]:
        return deepcopy(self.require_room(room_id).state)

    def update_sync_cursor(self, session_id: str, room_id: str, cursor: int) -> None:
        self.require_room(room_id)
        if session_id not in self.sessions:
            raise KeyError(f"session not found: {session_id}")
        if not isinstance(cursor, int) or cursor < 0:
            raise ValueError("cursor must be a non-negative integer")
        self.sync_cursors[(session_id, room_id)] = cursor

    def get_sync_cursor(self, session_id: str, room_id: str) -> int:
        return self.sync_cursors.get((session_id, room_id), 0)
