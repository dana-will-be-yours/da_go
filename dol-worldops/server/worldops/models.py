from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

STABLE_ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"
COMMAND_TYPE_PATTERN = r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CommandEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    command_id: str = Field(pattern=STABLE_ID_PATTERN)
    idempotency_key: str = Field(min_length=1, max_length=128)
    room_id: str = Field(pattern=STABLE_ID_PATTERN)
    session_id: str = Field(pattern=STABLE_ID_PATTERN)
    actor_member_id: str = Field(pattern=STABLE_ID_PATTERN)
    command_type: str = Field(pattern=COMMAND_TYPE_PATTERN)
    expected_version: int = Field(ge=0)
    payload: dict[str, Any] = Field(default_factory=dict)
    client_time: datetime | None = None

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, value: str) -> str:
        if "\n" in value or "\r" in value:
            raise ValueError("idempotency_key must be a single line")
        return value


class EventRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: str
    room_id: str
    room_version: int = Field(ge=1)
    command_id: str
    event_type: str
    payload: dict[str, Any]
    payload_hash: str
    occurred_at: datetime = Field(default_factory=utc_now)


class OperationReceipt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    receipt_id: str
    category: str
    source: str
    room_id: str | None = None
    session_id: str | None = None
    command_id: str | None = None
    status: str
    body_hash: str
    created_at: datetime = Field(default_factory=utc_now)
    formal_runtime_allowed: bool = False


class CommandResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["accepted", "duplicate", "conflict", "rejected"]
    command_id: str
    room_id: str
    room_version: int = Field(ge=0)
    event: EventRecord | None = None
    receipt: OperationReceipt
    error_code: str | None = None
    error_message: str | None = None
    current_version: int | None = None
    formal_runtime_allowed: bool = False


class RoomSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    snapshot_id: str
    room_id: str
    room_version: int = Field(ge=0)
    schema_version: str
    state: dict[str, Any]
    state_hash: str
    created_at: datetime = Field(default_factory=utc_now)
    authoritative: bool = True
    formal_runtime_allowed: bool = False


class SyncResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    room_id: str
    after_version: int = Field(ge=0)
    current_version: int = Field(ge=0)
    events: list[EventRecord]
    next_cursor: int = Field(ge=0)
    formal_runtime_allowed: bool = False


class SessionRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    room_id: str
    actor_member_id: str
    capabilities: frozenset[str]
    status: Literal["active", "revoked", "expired"] = "active"
    expires_at: datetime | None = None

    def is_active(self, now: datetime | None = None) -> bool:
        current = now or utc_now()
        return self.status == "active" and (self.expires_at is None or self.expires_at > current)
