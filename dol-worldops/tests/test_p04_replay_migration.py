from __future__ import annotations

from copy import deepcopy

import pytest

from worldops.canonical import sha256_hex
from worldops.event_replay import EventReplayError, WorldOpsEventReplayer
from worldops.schema_migration import SchemaMigrationError, SchemaMigrationRegistry


def snapshot(state: dict, *, version: int = 0, schema: str = "1", authoritative: bool = True) -> dict:
    return {
        "snapshot_id": "SNAP-1",
        "room_id": "ROOM-1",
        "room_version": version,
        "schema_version": schema,
        "state": deepcopy(state),
        "state_hash": sha256_hex(state),
        "authoritative": authoritative,
    }


def event(version: int, event_type: str, payload: dict, *, event_id: str | None = None) -> dict:
    return {
        "event_id": event_id or f"EVENT-{version}",
        "room_id": "ROOM-1",
        "room_version": version,
        "command_id": f"CMD-{version}",
        "event_type": event_type,
        "payload": deepcopy(payload),
        "payload_hash": sha256_hex(payload),
    }


def reducers():
    def message(state: dict, payload: dict) -> dict:
        state.setdefault("messages", []).append(deepcopy(payload))
        return state

    def token(state: dict, payload: dict) -> dict:
        state.setdefault("tokens", {})[payload["token_id"]] = {"x": payload["x"], "y": payload["y"]}
        return state

    return {"room.message.appended": message, "room.token.moved": token}


def test_migration_registry_finds_deterministic_path_without_mutating_source() -> None:
    registry = SchemaMigrationRegistry()
    registry.register("M-1-2", "1", "2", lambda state: {**state, "v2": True})
    registry.register("M-2-3", "2", "3", lambda state: {**state, "v3": True})
    registry.seal()
    source = {"room": {"status": "open"}}
    migrated, receipt = registry.migrate(source, "1", "3")
    assert source == {"room": {"status": "open"}}
    assert migrated["v2"] is True and migrated["v3"] is True
    assert receipt.path == ("1", "2", "3")
    assert receipt.migration_ids == ("M-1-2", "M-2-3")
    assert receipt.formal_runtime_allowed is False


def test_migration_registry_rejects_duplicate_edges_and_missing_paths() -> None:
    registry = SchemaMigrationRegistry()
    registry.register("M-1-2", "1", "2", lambda state: state)
    with pytest.raises(SchemaMigrationError, match="already exists") as duplicate:
        registry.register("M-1-2-B", "1", "2", lambda state: state)
    assert duplicate.value.code == "DUPLICATE_MIGRATION_EDGE"
    with pytest.raises(SchemaMigrationError) as missing:
        registry.path("2", "9")
    assert missing.value.code == "MIGRATION_PATH_NOT_FOUND"


def test_replayer_rebuilds_contiguous_event_stream_and_migrates_final_state() -> None:
    registry = SchemaMigrationRegistry()
    registry.register("M-1-2", "1", "2", lambda state: {**state, "schema_marker": 2})
    replayer = WorldOpsEventReplayer(reducers(), migration_registry=registry)
    rebuilt, receipt = replayer.rebuild(
        snapshot({"messages": [], "tokens": {}}, version=0),
        [
            event(1, "room.message.appended", {"message_id": "M1", "text": "hello"}),
            event(2, "room.token.moved", {"token_id": "T1", "x": 3, "y": 4}),
        ],
        target_schema_version="2",
    )
    assert rebuilt["messages"][0]["text"] == "hello"
    assert rebuilt["tokens"]["T1"] == {"x": 3, "y": 4}
    assert rebuilt["schema_marker"] == 2
    assert receipt.target_version == 2
    assert receipt.schema_version == "2"
    assert receipt.state_hash == sha256_hex(rebuilt)


def test_replayer_rejects_untrusted_or_corrupted_snapshot() -> None:
    replayer = WorldOpsEventReplayer(reducers())
    with pytest.raises(EventReplayError) as untrusted:
        replayer.rebuild(snapshot({}, authoritative=False), [])
    assert untrusted.value.code == "UNTRUSTED_SNAPSHOT"
    bad = snapshot({"a": 1})
    bad["state_hash"] = "0" * 64
    with pytest.raises(EventReplayError) as corrupted:
        replayer.rebuild(bad, [])
    assert corrupted.value.code == "SNAPSHOT_HASH_MISMATCH"


def test_replayer_rejects_sequence_gap_duplicate_and_hash_mismatch() -> None:
    replayer = WorldOpsEventReplayer(reducers())
    with pytest.raises(EventReplayError) as gap:
        replayer.rebuild(snapshot({}), [event(2, "room.message.appended", {"text": "late"})])
    assert gap.value.code == "EVENT_SEQUENCE_GAP"

    duplicate = [
        event(1, "room.message.appended", {"text": "a"}, event_id="E"),
        event(2, "room.message.appended", {"text": "b"}, event_id="E"),
    ]
    with pytest.raises(EventReplayError) as duplicate_error:
        replayer.rebuild(snapshot({}), duplicate)
    assert duplicate_error.value.code == "DUPLICATE_EVENT_ID"

    bad = event(1, "room.message.appended", {"text": "bad"})
    bad["payload_hash"] = "0" * 64
    with pytest.raises(EventReplayError) as hash_error:
        replayer.rebuild(snapshot({}), [bad])
    assert hash_error.value.code == "EVENT_HASH_MISMATCH"


def test_replayer_requires_registered_reducer() -> None:
    replayer = WorldOpsEventReplayer(reducers())
    with pytest.raises(EventReplayError) as error:
        replayer.rebuild(snapshot({}), [event(1, "room.unknown", {})])
    assert error.value.code == "EVENT_REDUCER_NOT_FOUND"
