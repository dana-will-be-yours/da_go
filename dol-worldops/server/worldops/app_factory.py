from __future__ import annotations

from typing import Annotated

from fastapi import FastAPI, Header, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .broker import WorldOpsEventBroker
from .models import CommandEnvelope, CommandResponse, SessionRecord
from .service import WorldOpsCommandService

SESSION_HEADER = "X-WorldOps-Session"


class SnapshotRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_version: int = Field(ge=0)


class HealthResponse(BaseModel):
    status: str = "ok"
    component: str = "worldops-authoritative-command-contract"
    formal_runtime_allowed: bool = False
    canon_write_allowed: bool = False
    client_cache_authoritative: bool = False


def _json(model: BaseModel, status_code: int = 200) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=model.model_dump(mode="json"))


def _session_error(code: str, message: str, *, status_code: int = 403) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "rejected",
            "error_code": code,
            "error_message": message,
            "formal_runtime_allowed": False,
        },
    )


def _status_code(response: CommandResponse) -> int:
    if response.status in {"accepted", "duplicate"}:
        return 200
    if response.status == "conflict":
        return 409
    if response.error_code == "ROOM_NOT_FOUND":
        return 404
    if response.error_code in {
        "SESSION_INVALID",
        "SESSION_ROOM_MISMATCH",
        "SESSION_ACTOR_MISMATCH",
        "CAPABILITY_DENIED",
    }:
        return 403
    return 422


def _authorized_session(
    service: WorldOpsCommandService,
    session_id: str,
    room_id: str,
    capability: str,
) -> SessionRecord | None:
    session = service.store.get_session(session_id)
    if session is None or not session.is_active():
        return None
    if session.room_id != room_id or capability not in session.capabilities:
        return None
    return session


def create_worldops_app(
    service: WorldOpsCommandService,
    *,
    broker: WorldOpsEventBroker | None = None,
) -> FastAPI:
    event_broker = broker or WorldOpsEventBroker()
    app = FastAPI(title="DaGo × TRPG WorldOps Authoritative Command Contract", version="0.3.0")
    app.state.worldops_service = service
    app.state.worldops_broker = event_broker

    @app.get("/api/worldops/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse()

    @app.post("/api/worldops/rooms/{room_id}/commands")
    async def submit_command(
        room_id: str,
        command: CommandEnvelope,
        session_header: Annotated[str | None, Header(alias=SESSION_HEADER)] = None,
    ) -> JSONResponse:
        if command.room_id != room_id:
            return _session_error("ROOM_PATH_MISMATCH", "command room_id does not match the route", status_code=400)
        if not session_header or session_header != command.session_id:
            return _session_error("SESSION_HEADER_MISMATCH", "session header is missing or does not match the command")
        response = await service.execute(command)
        if response.status == "accepted" and response.event is not None:
            await event_broker.publish(response.event)
        return _json(response, _status_code(response))

    @app.get("/api/worldops/rooms/{room_id}/events")
    async def sync_events(
        room_id: str,
        after_version: Annotated[int, Query(ge=0)] = 0,
        session_header: Annotated[str | None, Header(alias=SESSION_HEADER)] = None,
    ) -> JSONResponse:
        if not session_header or _authorized_session(service, session_header, room_id, "room.read") is None:
            return _session_error("SYNC_NOT_AUTHORIZED", "an active room.read session is required")
        try:
            response = service.sync(room_id, after_version)
        except KeyError:
            return _session_error("ROOM_NOT_FOUND", "room does not exist", status_code=404)
        service.store.update_sync_cursor(session_header, room_id, response.next_cursor)
        return _json(response)

    @app.get("/api/worldops/rooms/{room_id}/snapshot")
    async def latest_snapshot(
        room_id: str,
        session_header: Annotated[str | None, Header(alias=SESSION_HEADER)] = None,
    ) -> JSONResponse:
        if not session_header or _authorized_session(service, session_header, room_id, "room.read") is None:
            return _session_error("SNAPSHOT_NOT_AUTHORIZED", "an active room.read session is required")
        try:
            return _json(service.latest_snapshot(room_id))
        except KeyError:
            return _session_error("ROOM_NOT_FOUND", "room does not exist", status_code=404)

    @app.post("/api/worldops/rooms/{room_id}/snapshot-requests")
    async def create_snapshot(
        room_id: str,
        request: SnapshotRequest,
        session_header: Annotated[str | None, Header(alias=SESSION_HEADER)] = None,
    ) -> JSONResponse:
        if not session_header:
            return _session_error("SNAPSHOT_NOT_AUTHORIZED", "a session header is required")
        try:
            snapshot = service.create_snapshot(room_id, session_header, request.expected_version)
        except KeyError:
            return _session_error("ROOM_NOT_FOUND", "room does not exist", status_code=404)
        except PermissionError as error:
            return _session_error("SNAPSHOT_NOT_AUTHORIZED", str(error))
        except RuntimeError as error:
            return JSONResponse(
                status_code=409,
                content={
                    "status": "conflict",
                    "error_code": "SNAPSHOT_VERSION_CONFLICT",
                    "error_message": str(error),
                    "formal_runtime_allowed": False,
                },
            )
        return _json(snapshot, 201)

    @app.websocket("/ws/worldops/rooms/{room_id}")
    async def room_events(
        websocket: WebSocket,
        room_id: str,
        session_id: str,
        after_version: int = 0,
    ) -> None:
        session = _authorized_session(service, session_id, room_id, "room.read")
        if session is None or after_version < 0:
            await websocket.close(code=4403)
            return
        if service.store.get_room(room_id) is None:
            await websocket.close(code=4404)
            return

        await websocket.accept()
        last_sent = after_version
        try:
            async with event_broker.subscribe(room_id) as queue:
                backlog = service.sync(room_id, after_version)
                await websocket.send_json({
                    "type": "sync",
                    "room_id": room_id,
                    "after_version": after_version,
                    "current_version": backlog.current_version,
                    "events": [event.model_dump(mode="json") for event in backlog.events],
                    "next_cursor": backlog.next_cursor,
                    "formal_runtime_allowed": False,
                })
                last_sent = backlog.next_cursor
                service.store.update_sync_cursor(session_id, room_id, last_sent)

                while True:
                    event = await queue.get()
                    if event.room_version <= last_sent:
                        continue
                    await websocket.send_json({
                        "type": "event",
                        "event": event.model_dump(mode="json"),
                        "next_cursor": event.room_version,
                        "formal_runtime_allowed": False,
                    })
                    last_sent = event.room_version
                    service.store.update_sync_cursor(session_id, room_id, last_sent)
        except WebSocketDisconnect:
            return

    return app
