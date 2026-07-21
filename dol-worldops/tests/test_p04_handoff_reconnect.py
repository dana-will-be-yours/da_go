from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from worldops.handoff import HandoffError, WorldOpsHandoffService
from worldops.reconnect import ReconnectError, WorldOpsReconnectService


class Clock:
    def __init__(self) -> None:
        self.value = datetime(2026, 7, 21, tzinfo=timezone.utc)

    def now(self) -> datetime:
        return self.value

    def advance(self, seconds: int) -> None:
        self.value += timedelta(seconds=seconds)


def test_handoff_is_single_use_and_plaintext_token_is_not_stored() -> None:
    clock = Clock()
    service = WorldOpsHandoffService(
        now=clock.now,
        token_factory=lambda: "T" * 48,
        id_factory=lambda: "HANDOFF-1",
    )
    issued = service.issue(
        room_id="ROOM-1",
        session_id="SESSION-1",
        actor_member_id="MEMBER-1",
        source_device_id="DESKTOP-1",
        target_device_class="mobile",
        cursor=12,
    )
    assert issued["handoff_token"] == "T" * 48
    assert service.records["HANDOFF-1"].token_hash != issued["handoff_token"]
    consumed = service.consume(
        handoff_token=issued["handoff_token"],
        room_id="ROOM-1",
        session_id="SESSION-1",
        target_device_id="PHONE-1",
        target_device_class="mobile",
    )
    assert consumed["status"] == "consumed"
    assert consumed["cursor"] == 12
    with pytest.raises(HandoffError) as reused:
        service.consume(
            handoff_token=issued["handoff_token"],
            room_id="ROOM-1",
            session_id="SESSION-1",
            target_device_id="PHONE-2",
            target_device_class="mobile",
        )
    assert reused.value.code == "HANDOFF_ALREADY_USED"


def test_handoff_enforces_expiry_and_bindings() -> None:
    clock = Clock()
    counter = iter(["H1", "H2", "H3"])
    token_counter = iter(["A" * 40, "B" * 40, "C" * 40])
    service = WorldOpsHandoffService(now=clock.now, id_factory=lambda: next(counter), token_factory=lambda: next(token_counter))
    expired = service.issue(
        room_id="ROOM-1", session_id="S1", actor_member_id="M1", source_device_id="D1", target_device_class="mobile", cursor=0, ttl_seconds=10
    )
    clock.advance(10)
    with pytest.raises(HandoffError) as expiry:
        service.consume(
            handoff_token=expired["handoff_token"], room_id="ROOM-1", session_id="S1", target_device_id="D2", target_device_class="mobile"
        )
    assert expiry.value.code == "HANDOFF_EXPIRED"

    bound = service.issue(
        room_id="ROOM-1", session_id="S1", actor_member_id="M1", source_device_id="D1", target_device_class="tablet", cursor=3
    )
    with pytest.raises(HandoffError) as mismatch:
        service.consume(
            handoff_token=bound["handoff_token"], room_id="ROOM-2", session_id="S1", target_device_id="D2", target_device_class="tablet"
        )
    assert mismatch.value.code == "HANDOFF_BINDING_MISMATCH"


def make_reconnect(*, current: int = 8, snapshot_version: int = 5, max_window: int = 3, threshold: int = 6):
    events = [SimpleNamespace(room_version=version) for version in range(1, current + 1)]
    return WorldOpsReconnectService(
        current_version=lambda room_id: current,
        events_after=lambda room_id, cursor: [event for event in events if event.room_version > cursor],
        latest_snapshot=lambda room_id: SimpleNamespace(room_version=snapshot_version, snapshot_id="SNAP-5"),
        max_event_window=max_window,
        snapshot_threshold=threshold,
    )


def test_reconnect_delivers_bounded_contiguous_windows_and_monotonic_ack() -> None:
    service = make_reconnect(current=5, max_window=2, threshold=10)
    first = service.plan(room_id="ROOM-1", session_id="S1", cursor=0)
    assert first.mode == "events"
    assert [event.room_version for event in first.events] == [1, 2]
    assert first.has_more is True
    ack = service.acknowledge(room_id="ROOM-1", session_id="S1", cursor=2)
    assert ack["acknowledged_cursor"] == 2
    second = service.plan(room_id="ROOM-1", session_id="S1", cursor=2)
    assert [event.room_version for event in second.events] == [3, 4]
    with pytest.raises(ReconnectError) as ahead:
        service.acknowledge(room_id="ROOM-1", session_id="S1", cursor=5)
    assert ahead.value.code == "RECONNECT_ACK_AHEAD"


def test_reconnect_uses_snapshot_for_large_backlog() -> None:
    service = make_reconnect(current=20, snapshot_version=15, max_window=3, threshold=6)
    plan = service.plan(room_id="ROOM-1", session_id="S1", cursor=0)
    assert plan.mode == "snapshot_then_events"
    assert plan.snapshot.snapshot_id == "SNAP-5"
    assert [event.room_version for event in plan.events] == [16, 17, 18]
    assert plan.next_cursor == 18
    assert plan.has_more is True


def test_reconnect_rejects_cursor_regression_ahead_and_event_gap() -> None:
    service = make_reconnect(current=5, max_window=5, threshold=10)
    service.plan(room_id="ROOM-1", session_id="S1", cursor=0)
    service.acknowledge(room_id="ROOM-1", session_id="S1", cursor=3)
    with pytest.raises(ReconnectError) as regression:
        service.plan(room_id="ROOM-1", session_id="S1", cursor=2)
    assert regression.value.code == "RECONNECT_CURSOR_REGRESSION"
    with pytest.raises(ReconnectError) as ahead:
        service.plan(room_id="ROOM-1", session_id="S2", cursor=6)
    assert ahead.value.code == "RECONNECT_CURSOR_AHEAD"

    bad_events = [SimpleNamespace(room_version=1), SimpleNamespace(room_version=3)]
    gap_service = WorldOpsReconnectService(
        current_version=lambda room_id: 3,
        events_after=lambda room_id, cursor: [event for event in bad_events if event.room_version > cursor],
        latest_snapshot=lambda room_id: {"room_version": 0},
        max_event_window=5,
        snapshot_threshold=10,
    )
    with pytest.raises(ReconnectError) as gap:
        gap_service.plan(room_id="ROOM-1", session_id="S1", cursor=0)
    assert gap.value.code == "RECONNECT_EVENT_GAP"


def test_reconnect_ignores_snapshot_that_is_not_newer_than_client_cursor() -> None:
    events = [SimpleNamespace(room_version=version) for version in range(1, 21)]
    service = WorldOpsReconnectService(
        current_version=lambda room_id: 20,
        events_after=lambda room_id, cursor: [event for event in events if event.room_version > cursor],
        latest_snapshot=lambda room_id: SimpleNamespace(room_version=5, snapshot_id="OLD"),
        max_event_window=3,
        snapshot_threshold=6,
    )
    plan = service.plan(room_id="ROOM-1", session_id="S1", cursor=10)
    assert plan.mode == "events"
    assert plan.snapshot is None
    assert [event.room_version for event in plan.events] == [11, 12, 13]


def test_reconnect_rejects_events_beyond_authoritative_version() -> None:
    service = WorldOpsReconnectService(
        current_version=lambda room_id: 2,
        events_after=lambda room_id, cursor: [
            SimpleNamespace(room_version=1),
            SimpleNamespace(room_version=2),
            SimpleNamespace(room_version=3),
        ],
        latest_snapshot=lambda room_id: {"room_version": 0},
        max_event_window=5,
        snapshot_threshold=10,
    )
    with pytest.raises(ReconnectError) as ahead:
        service.plan(room_id="ROOM-1", session_id="S1", cursor=0)
    assert ahead.value.code == "RECONNECT_EVENT_AHEAD"
