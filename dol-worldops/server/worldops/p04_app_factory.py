from __future__ import annotations

from typing import Any

from fastapi import FastAPI

from .app_factory import create_worldops_app
from .p04_runtime import install_p04_runtime


def create_worldops_p04_app(
    service: Any,
    *,
    broker: Any | None = None,
    max_event_window: int = 100,
    snapshot_threshold: int = 500,
) -> FastAPI:
    """Create the P03 authoritative app and attach P04 recovery routes."""

    app = create_worldops_app(service, broker=broker)
    install_p04_runtime(
        app,
        service,
        max_event_window=max_event_window,
        snapshot_threshold=snapshot_threshold,
    )
    app.title = "DaGo × TRPG WorldOps Authoritative Runtime and Recovery Contract"
    app.version = "0.4.0"
    app.state.worldops_runtime_version = "0.4.0"
    app.state.worldops_formal_runtime_allowed = False
    return app
