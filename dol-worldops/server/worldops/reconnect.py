from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


class ReconnectError(ValueError):
    def __init__(self, code: str, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


@dataclass(frozen=True)
class ReconnectPlan:
    room_id: str
    session_id: str
    mode: str
    requested_cursor: int
    current_version: int
    next_cursor: int
    events: tuple[Any, ...]
    snapshot: Any | None
    has_more: bool
    delivery_window: int
    formal_runtime_allowed: bool = False


@dataclass
class DeliveryState:
    delivered_cursor: int = 0
    acknowledged_cursor: int = 0
    in_flight: set[int] = field(default_factory=set)


class WorldOpsReconnectService:
    """Plans bounded event replay and explicit snapshot fallbacks.

    The service does not make room state authoritative. It coordinates transport
    receipts around the authoritative event stream supplied by the repository.
    """

    def __init__(
        self,
        *,
        current_version: Callable[[str], int],
        events_after: Callable[[str, int], list[Any]],
        latest_snapshot: Callable[[str], Any],
        event_version: Callable[[Any], int] = lambda event: int(event.room_version),
        max_event_window: int = 100,
        snapshot_threshold: int = 500,
    ) -> None:
        self.current_version = current_version
        self.events_after = events_after
        self.latest_snapshot = latest_snapshot
        self.event_version = event_version
        self.max_event_window = max(1, int(max_event_window))
        self.snapshot_threshold = max(self.max_event_window, int(snapshot_threshold))
        self.delivery: dict[tuple[str, str], DeliveryState] = {}

    def plan(
        self,
        *,
        room_id: str,
        session_id: str,
        cursor: int,
        delivery_window: int | None = None,
    ) -> ReconnectPlan:
        if not isinstance(cursor, int) or cursor < 0:
            raise ReconnectError("INVALID_RECONNECT_CURSOR", "cursor must be a non-negative integer")
        current = int(self.current_version(room_id))
        if cursor > current:
            raise ReconnectError(
                "RECONNECT_CURSOR_AHEAD",
                "client cursor is ahead of the authoritative room version",
                details={"cursor": cursor, "current_version": current},
            )
        window = self.max_event_window if delivery_window is None else max(1, min(int(delivery_window), self.max_event_window))
        backlog_size = current - cursor
        snapshot = None
        mode = "events"
        start_cursor = cursor
        if backlog_size > self.snapshot_threshold:
            snapshot = self.latest_snapshot(room_id)
            if hasattr(snapshot, "room_version"):
                snapshot_version = int(snapshot.room_version)
            elif isinstance(snapshot, dict) and "room_version" in snapshot:
                snapshot_version = int(snapshot["room_version"])
            else:
                raise ReconnectError("INVALID_RECONNECT_SNAPSHOT", "snapshot does not expose room_version")
            if snapshot_version < 0 or snapshot_version > current:
                raise ReconnectError("INVALID_RECONNECT_SNAPSHOT", "snapshot version is outside the room event range")
            if snapshot_version > cursor:
                start_cursor = snapshot_version
                mode = "snapshot_then_events"
            else:
                snapshot = None
        all_events = sorted(self.events_after(room_id, start_cursor), key=self.event_version)
        expected = start_cursor + 1
        for event in all_events:
            actual = self.event_version(event)
            if actual > current:
                raise ReconnectError(
                    "RECONNECT_EVENT_AHEAD",
                    "event backlog contains a version beyond the authoritative room version",
                    details={"event_version": actual, "current_version": current},
                )
            if actual != expected:
                raise ReconnectError(
                    "RECONNECT_EVENT_GAP",
                    "event backlog is not contiguous",
                    details={"expected_version": expected, "actual_version": actual},
                )
            expected += 1
        delivered = tuple(all_events[:window])
        next_cursor = start_cursor if not delivered else self.event_version(delivered[-1])
        key = (session_id, room_id)
        state = self.delivery.setdefault(key, DeliveryState(acknowledged_cursor=cursor, delivered_cursor=cursor))
        if cursor < state.acknowledged_cursor:
            raise ReconnectError(
                "RECONNECT_CURSOR_REGRESSION",
                "client cursor is behind its acknowledged cursor",
                details={"cursor": cursor, "acknowledged_cursor": state.acknowledged_cursor},
            )
        state.delivered_cursor = max(state.delivered_cursor, next_cursor)
        state.in_flight.update(self.event_version(event) for event in delivered)
        return ReconnectPlan(
            room_id=room_id,
            session_id=session_id,
            mode=mode,
            requested_cursor=cursor,
            current_version=current,
            next_cursor=next_cursor,
            events=delivered,
            snapshot=snapshot,
            has_more=next_cursor < current,
            delivery_window=window,
        )

    def acknowledge(self, *, room_id: str, session_id: str, cursor: int) -> dict[str, Any]:
        key = (session_id, room_id)
        state = self.delivery.get(key)
        if state is None:
            raise ReconnectError("RECONNECT_PLAN_REQUIRED", "a reconnect plan must be issued before acknowledgement")
        if not isinstance(cursor, int) or cursor < state.acknowledged_cursor:
            raise ReconnectError("RECONNECT_ACK_REGRESSION", "acknowledgement cursor cannot move backwards")
        if cursor > state.delivered_cursor:
            raise ReconnectError(
                "RECONNECT_ACK_AHEAD",
                "acknowledgement cursor exceeds the delivered cursor",
                details={"cursor": cursor, "delivered_cursor": state.delivered_cursor},
            )
        state.acknowledged_cursor = cursor
        state.in_flight = {version for version in state.in_flight if version > cursor}
        return {
            "room_id": room_id,
            "session_id": session_id,
            "acknowledged_cursor": cursor,
            "delivered_cursor": state.delivered_cursor,
            "in_flight_count": len(state.in_flight),
            "formal_runtime_allowed": False,
        }
