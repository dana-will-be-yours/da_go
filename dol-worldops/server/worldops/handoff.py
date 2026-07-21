from __future__ import annotations

import secrets
from dataclasses import dataclass, replace
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from .canonical import sha256_hex


class HandoffError(ValueError):
    def __init__(self, code: str, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class HandoffRecord:
    handoff_id: str
    token_hash: str
    room_id: str
    session_id: str
    actor_member_id: str
    source_device_id: str
    target_device_class: str
    cursor: int
    issued_at: datetime
    expires_at: datetime
    status: str = "issued"
    consumed_at: datetime | None = None
    consumed_device_id: str | None = None


class WorldOpsHandoffService:
    """Single-use, short-lived cross-device handoff tickets.

    Plaintext tokens are returned only from issue() and are never stored.
    """

    def __init__(
        self,
        *,
        now: Callable[[], datetime] = utc_now,
        token_factory: Callable[[], str] | None = None,
        id_factory: Callable[[], str] | None = None,
        default_ttl_seconds: int = 120,
    ) -> None:
        self.now = now
        self.token_factory = token_factory or (lambda: secrets.token_urlsafe(32))
        self.id_factory = id_factory or (lambda: secrets.token_hex(16))
        self.default_ttl_seconds = max(10, min(int(default_ttl_seconds), 600))
        self.records: dict[str, HandoffRecord] = {}
        self.by_hash: dict[str, str] = {}

    @staticmethod
    def _required(value: str, name: str) -> str:
        if not isinstance(value, str) or not value.strip() or "\n" in value or "\r" in value:
            raise HandoffError("INVALID_HANDOFF_FIELD", f"{name} must be a non-empty single-line string")
        return value

    def issue(
        self,
        *,
        room_id: str,
        session_id: str,
        actor_member_id: str,
        source_device_id: str,
        target_device_class: str,
        cursor: int,
        ttl_seconds: int | None = None,
    ) -> dict[str, Any]:
        for name, value in {
            "room_id": room_id,
            "session_id": session_id,
            "actor_member_id": actor_member_id,
            "source_device_id": source_device_id,
            "target_device_class": target_device_class,
        }.items():
            self._required(value, name)
        if not isinstance(cursor, int) or cursor < 0:
            raise HandoffError("INVALID_HANDOFF_CURSOR", "cursor must be a non-negative integer")
        ttl = self.default_ttl_seconds if ttl_seconds is None else max(10, min(int(ttl_seconds), 600))
        token = self.token_factory()
        if not isinstance(token, str) or len(token) < 32:
            raise HandoffError("HANDOFF_TOKEN_TOO_WEAK", "handoff token must contain at least 32 characters")
        token_hash = sha256_hex({"token": token})
        if token_hash in self.by_hash:
            raise HandoffError("HANDOFF_TOKEN_COLLISION", "handoff token collision detected")
        issued_at = self.now()
        record = HandoffRecord(
            handoff_id=self.id_factory(),
            token_hash=token_hash,
            room_id=room_id,
            session_id=session_id,
            actor_member_id=actor_member_id,
            source_device_id=source_device_id,
            target_device_class=target_device_class,
            cursor=cursor,
            issued_at=issued_at,
            expires_at=issued_at + timedelta(seconds=ttl),
        )
        self.records[record.handoff_id] = record
        self.by_hash[token_hash] = record.handoff_id
        return {
            "handoff_id": record.handoff_id,
            "handoff_token": token,
            "room_id": room_id,
            "session_id": session_id,
            "target_device_class": target_device_class,
            "cursor": cursor,
            "expires_at": record.expires_at,
            "formal_runtime_allowed": False,
        }

    def consume(
        self,
        *,
        handoff_token: str,
        room_id: str,
        session_id: str,
        target_device_id: str,
        target_device_class: str,
    ) -> dict[str, Any]:
        for name, value in {
            "handoff_token": handoff_token,
            "room_id": room_id,
            "session_id": session_id,
            "target_device_id": target_device_id,
            "target_device_class": target_device_class,
        }.items():
            self._required(value, name)
        token_hash = sha256_hex({"token": handoff_token})
        handoff_id = self.by_hash.get(token_hash)
        if handoff_id is None:
            raise HandoffError("HANDOFF_TOKEN_INVALID", "handoff token is invalid")
        record = self.records[handoff_id]
        current = self.now()
        if record.status != "issued":
            raise HandoffError("HANDOFF_ALREADY_USED", "handoff token has already been consumed or revoked")
        if current >= record.expires_at:
            self.records[handoff_id] = replace(record, status="expired")
            raise HandoffError("HANDOFF_EXPIRED", "handoff token has expired")
        if record.room_id != room_id or record.session_id != session_id:
            raise HandoffError("HANDOFF_BINDING_MISMATCH", "handoff token does not match room and session")
        if record.target_device_class != target_device_class:
            raise HandoffError("HANDOFF_DEVICE_CLASS_MISMATCH", "target device class does not match the ticket")
        consumed = replace(
            record,
            status="consumed",
            consumed_at=current,
            consumed_device_id=target_device_id,
        )
        self.records[handoff_id] = consumed
        return {
            "handoff_id": handoff_id,
            "status": "consumed",
            "room_id": room_id,
            "session_id": session_id,
            "actor_member_id": record.actor_member_id,
            "source_device_id": record.source_device_id,
            "target_device_id": target_device_id,
            "cursor": record.cursor,
            "consumed_at": current,
            "formal_runtime_allowed": False,
        }

    def revoke(self, handoff_id: str) -> bool:
        record = self.records.get(handoff_id)
        if record is None or record.status != "issued":
            return False
        self.records[handoff_id] = replace(record, status="revoked")
        return True
