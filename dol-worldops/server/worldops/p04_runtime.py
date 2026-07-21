from __future__ import annotations

from typing import Any

from fastapi import FastAPI

from .handoff import WorldOpsHandoffService
from .p04_router import create_p04_router
from .reconnect import WorldOpsReconnectService


def install_p04_runtime(
    app: FastAPI,
    service: Any,
    *,
    max_event_window: int = 100,
    snapshot_threshold: int = 500,
) -> tuple[WorldOpsHandoffService, WorldOpsReconnectService]:
    """Attach P04 handoff and reconnect endpoints to an existing P03 app.

    The supplied P03 service remains the authoritative command/snapshot facade.
    P04 services hold transport coordination records only and never mutate canon.
    """

    required_store_methods = ("get_session", "require_room", "events_after")
    if not hasattr(service, "store"):
        raise TypeError("P04 requires a P03 service with a store")
    for method in required_store_methods:
        if not callable(getattr(service.store, method, None)):
            raise TypeError(f"P04 requires service.store.{method}()")
    if not callable(getattr(service, "latest_snapshot", None)):
        raise TypeError("P04 requires service.latest_snapshot()")

    handoffs = WorldOpsHandoffService()
    reconnect = WorldOpsReconnectService(
        current_version=lambda room_id: int(service.store.require_room(room_id).version),
        events_after=lambda room_id, cursor: service.store.events_after(room_id, cursor),
        latest_snapshot=lambda room_id: service.latest_snapshot(room_id),
        max_event_window=max_event_window,
        snapshot_threshold=snapshot_threshold,
    )
    app.include_router(
        create_p04_router(
            handoffs=handoffs,
            reconnect=reconnect,
            resolve_session=service.store.get_session,
        )
    )
    app.state.worldops_handoff_service = handoffs
    app.state.worldops_reconnect_service = reconnect
    app.state.worldops_p04_formal_runtime_allowed = False
    return handoffs, reconnect
