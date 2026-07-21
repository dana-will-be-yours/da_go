from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Callable
from uuid import uuid4

from .canonical import sha256_hex
from .models import (
    CommandEnvelope,
    CommandResponse,
    EventRecord,
    OperationReceipt,
    RoomSnapshot,
    SessionRecord,
    SyncResponse,
    utc_now,
)
from .store import InMemoryWorldOpsStore, StoredCommand


@dataclass(frozen=True)
class CommandMutation:
    event_type: str
    event_payload: dict[str, Any]
    next_state: dict[str, Any]


CommandHandler = Callable[[dict[str, Any], dict[str, Any], SessionRecord], CommandMutation]


@dataclass(frozen=True)
class CommandDefinition:
    command_type: str
    required_capability: str
    handler: CommandHandler


class WorldOpsCommandService:
    def __init__(self, store: InMemoryWorldOpsStore) -> None:
        self.store = store
        self.definitions: dict[str, CommandDefinition] = {}

    def register(self, command_type: str, required_capability: str, handler: CommandHandler) -> None:
        if command_type in self.definitions:
            raise ValueError(f"command already registered: {command_type}")
        self.definitions[command_type] = CommandDefinition(command_type, required_capability, handler)

    async def execute(self, command: CommandEnvelope) -> CommandResponse:
        room = self.store.get_room(command.room_id)
        if room is None:
            return self._reject(command, "ROOM_NOT_FOUND", "room does not exist", room_version=0)

        session = self.store.get_session(command.session_id)
        if session is None or not session.is_active():
            return self._reject(command, "SESSION_INVALID", "session is missing, expired, or revoked", room_version=room.version)
        if session.room_id != command.room_id:
            return self._reject(command, "SESSION_ROOM_MISMATCH", "session is not bound to this room", room_version=room.version)
        if session.actor_member_id != command.actor_member_id:
            return self._reject(command, "SESSION_ACTOR_MISMATCH", "session actor does not match command actor", room_version=room.version)

        definition = self.definitions.get(command.command_type)
        if definition is None:
            return self._reject(command, "UNKNOWN_COMMAND_TYPE", "command type is not registered", room_version=room.version)
        if definition.required_capability not in session.capabilities:
            return self._reject(command, "CAPABILITY_DENIED", "session lacks the required capability", room_version=room.version)

        fingerprint = sha256_hex({
            "idempotency_key": command.idempotency_key,
            "room_id": command.room_id,
            "session_id": command.session_id,
            "actor_member_id": command.actor_member_id,
            "command_type": command.command_type,
            "expected_version": command.expected_version,
            "payload": command.payload,
        })

        async with self.store.room_lock(command.room_id):
            existing_id = room.commands_by_id.get(command.command_id)
            if existing_id is not None:
                if existing_id.fingerprint == fingerprint:
                    return self._replay(existing_id.response)
                return self._reject(command, "COMMAND_ID_REUSED", "command_id was reused with different content", room_version=room.version)

            existing_key = room.commands_by_idempotency.get(command.idempotency_key)
            if existing_key is not None:
                if existing_key.fingerprint == fingerprint:
                    return self._replay(existing_key.response)
                return self._reject(command, "IDEMPOTENCY_KEY_REUSED", "idempotency_key was reused with different content", room_version=room.version)

            if command.expected_version != room.version:
                response = self._conflict(command, current_version=room.version)
                stored = StoredCommand(command.command_id, command.idempotency_key, fingerprint, response)
                room.commands_by_id[command.command_id] = stored
                room.commands_by_idempotency[command.idempotency_key] = stored
                return response

            try:
                mutation = definition.handler(deepcopy(room.state), deepcopy(command.payload), session)
            except (TypeError, ValueError, KeyError) as error:
                response = self._reject(command, "COMMAND_VALIDATION_FAILED", str(error), room_version=room.version)
                stored = StoredCommand(command.command_id, command.idempotency_key, fingerprint, response)
                room.commands_by_id[command.command_id] = stored
                room.commands_by_idempotency[command.idempotency_key] = stored
                return response

            next_version = room.version + 1
            event_payload = deepcopy(mutation.event_payload)
            event = EventRecord(
                event_id=str(uuid4()),
                room_id=command.room_id,
                room_version=next_version,
                command_id=command.command_id,
                event_type=mutation.event_type,
                payload=event_payload,
                payload_hash=sha256_hex(event_payload),
            )
            room.state = deepcopy(mutation.next_state)
            room.version = next_version
            room.events.append(event)
            response = CommandResponse(
                status="accepted",
                command_id=command.command_id,
                room_id=command.room_id,
                room_version=next_version,
                event=event,
                receipt=self._receipt(
                    command,
                    status="accepted",
                    body={"event_id": event.event_id, "room_version": next_version, "payload_hash": event.payload_hash},
                ),
            )
            stored = StoredCommand(command.command_id, command.idempotency_key, fingerprint, response)
            room.commands_by_id[command.command_id] = stored
            room.commands_by_idempotency[command.idempotency_key] = stored
            return response.model_copy(deep=True)

    def sync(self, room_id: str, after_version: int = 0) -> SyncResponse:
        room = self.store.require_room(room_id)
        events = self.store.events_after(room_id, after_version)
        return SyncResponse(
            room_id=room_id,
            after_version=after_version,
            current_version=room.version,
            events=events,
            next_cursor=room.version,
        )

    def create_snapshot(self, room_id: str, session_id: str, expected_version: int) -> RoomSnapshot:
        room = self.store.require_room(room_id)
        session = self.store.get_session(session_id)
        if session is None or not session.is_active() or session.room_id != room_id:
            raise PermissionError("session is not authorized for this room")
        if "snapshot.request" not in session.capabilities:
            raise PermissionError("session lacks snapshot.request")
        if expected_version != room.version:
            raise RuntimeError(f"snapshot version conflict: expected {expected_version}, current {room.version}")
        state = deepcopy(room.state)
        snapshot = RoomSnapshot(
            snapshot_id=str(uuid4()),
            room_id=room_id,
            room_version=room.version,
            schema_version=room.schema_version,
            state=state,
            state_hash=sha256_hex(state),
            authoritative=True,
        )
        room.snapshots.append(snapshot)
        return snapshot.model_copy(deep=True)

    def latest_snapshot(self, room_id: str) -> RoomSnapshot:
        room = self.store.require_room(room_id)
        snapshot = self.store.latest_snapshot(room_id)
        if snapshot is not None:
            return snapshot
        state = deepcopy(room.state)
        return RoomSnapshot(
            snapshot_id=f"initial-{room_id}",
            room_id=room_id,
            room_version=room.version,
            schema_version=room.schema_version,
            state=state,
            state_hash=sha256_hex(state),
            authoritative=True,
        )

    def _replay(self, original: CommandResponse) -> CommandResponse:
        replay = original.model_copy(deep=True)
        replay.status = "duplicate" if original.status == "accepted" else original.status
        replay.receipt = replay.receipt.model_copy(update={
            "status": f"replayed_{original.status}",
            "receipt_id": str(uuid4()),
            "created_at": utc_now(),
            "body_hash": sha256_hex({
                "original_receipt_id": original.receipt.receipt_id,
                "original_status": original.status,
                "room_version": original.room_version,
            }),
        })
        return replay

    def _conflict(self, command: CommandEnvelope, current_version: int) -> CommandResponse:
        return CommandResponse(
            status="conflict",
            command_id=command.command_id,
            room_id=command.room_id,
            room_version=current_version,
            current_version=current_version,
            error_code="VERSION_CONFLICT",
            error_message="expected_version does not match current room version",
            receipt=self._receipt(
                command,
                status="conflict",
                body={"expected_version": command.expected_version, "current_version": current_version},
            ),
        )

    def _reject(self, command: CommandEnvelope, code: str, message: str, room_version: int) -> CommandResponse:
        return CommandResponse(
            status="rejected",
            command_id=command.command_id,
            room_id=command.room_id,
            room_version=room_version,
            error_code=code,
            error_message=message,
            receipt=self._receipt(
                command,
                status="rejected",
                body={"error_code": code, "message": message, "room_version": room_version},
            ),
        )

    def _receipt(self, command: CommandEnvelope, *, status: str, body: dict[str, Any]) -> OperationReceipt:
        return OperationReceipt(
            receipt_id=str(uuid4()),
            category="command",
            source="worldops-command-service",
            room_id=command.room_id,
            session_id=command.session_id,
            command_id=command.command_id,
            status=status,
            body_hash=sha256_hex(body),
            formal_runtime_allowed=False,
        )


def register_default_commands(service: WorldOpsCommandService) -> None:
    def append_message(state: dict[str, Any], payload: dict[str, Any], session: SessionRecord) -> CommandMutation:
        text = payload.get("text")
        channel = payload.get("channel", "ic")
        if not isinstance(text, str) or not text.strip():
            raise ValueError("text is required")
        if channel not in {"ic", "ooc", "gm", "system"}:
            raise ValueError("unsupported message channel")
        messages = list(state.get("messages", []))
        message = {
            "message_id": str(uuid4()),
            "actor_member_id": session.actor_member_id,
            "channel": channel,
            "text": text,
        }
        messages.append(message)
        state["messages"] = messages
        return CommandMutation("room.message.appended", message, state)

    def move_token(state: dict[str, Any], payload: dict[str, Any], session: SessionRecord) -> CommandMutation:
        token_id = payload.get("token_id")
        x = payload.get("x")
        y = payload.get("y")
        if not isinstance(token_id, str) or not token_id:
            raise ValueError("token_id is required")
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            raise ValueError("x and y must be numeric")
        tokens = deepcopy(state.get("tokens", {}))
        current = deepcopy(tokens.get(token_id, {}))
        current.update({"x": float(x), "y": float(y), "moved_by": session.actor_member_id})
        tokens[token_id] = current
        state["tokens"] = tokens
        return CommandMutation("room.token.moved", {"token_id": token_id, **current}, state)

    def activate_scene(state: dict[str, Any], payload: dict[str, Any], session: SessionRecord) -> CommandMutation:
        scene_id = payload.get("scene_id")
        if not isinstance(scene_id, str) or not scene_id:
            raise ValueError("scene_id is required")
        state["active_scene_id"] = scene_id
        return CommandMutation(
            "room.scene.activated",
            {"scene_id": scene_id, "activated_by": session.actor_member_id},
            state,
        )

    service.register("room.message.append", "chat.send", append_message)
    service.register("room.token.move", "map.token.move", move_token)
    service.register("room.scene.activate", "room.manage", activate_scene)
