from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from .handoff import HandoffError, WorldOpsHandoffService
from .reconnect import ReconnectError, WorldOpsReconnectService


SESSION_HEADER = "X-WorldOps-Session"


class HandoffIssueRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_device_id: str = Field(min_length=1, max_length=128)
    target_device_class: str = Field(min_length=1, max_length=64)
    cursor: int = Field(ge=0)
    ttl_seconds: int = Field(default=120, ge=10, le=600)


class HandoffConsumeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    handoff_token: str = Field(min_length=32, max_length=1024)
    room_id: str = Field(min_length=1, max_length=128)
    session_id: str = Field(min_length=1, max_length=128)
    target_device_id: str = Field(min_length=1, max_length=128)
    target_device_class: str = Field(min_length=1, max_length=64)


class ReconnectPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cursor: int = Field(ge=0)
    delivery_window: int | None = Field(default=None, ge=1, le=1000)


class ReconnectAckRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cursor: int = Field(ge=0)


def create_p04_router(
    *,
    handoffs: WorldOpsHandoffService,
    reconnect: WorldOpsReconnectService,
    resolve_session: Callable[[str], Any | None],
) -> APIRouter:
    router = APIRouter()

    def error_response(error: Exception, default_status: int = 422) -> JSONResponse:
        code = getattr(error, "code", "P04_REQUEST_FAILED")
        status = 409 if code in {
            "HANDOFF_ALREADY_USED",
            "HANDOFF_EXPIRED",
            "HANDOFF_CURSOR_AHEAD",
            "RECONNECT_CURSOR_AHEAD",
            "RECONNECT_CURSOR_REGRESSION",
            "RECONNECT_ACK_REGRESSION",
            "RECONNECT_ACK_AHEAD",
        } else default_status
        return JSONResponse(
            status_code=status,
            content={
                "status": "rejected",
                "error_code": code,
                "error_message": str(error),
                "details": getattr(error, "details", {}),
                "formal_runtime_allowed": False,
            },
        )

    def require_session(session_id: str | None, room_id: str | None = None) -> Any | JSONResponse:
        if not session_id:
            return JSONResponse(status_code=401, content={"status": "rejected", "error_code": "SESSION_REQUIRED", "formal_runtime_allowed": False})
        session = resolve_session(session_id)
        if session is None or not session.is_active():
            return JSONResponse(status_code=401, content={"status": "rejected", "error_code": "SESSION_INVALID", "formal_runtime_allowed": False})
        if room_id is not None and session.room_id != room_id:
            return JSONResponse(status_code=403, content={"status": "rejected", "error_code": "SESSION_ROOM_MISMATCH", "formal_runtime_allowed": False})
        return session

    @router.post("/api/worldops/rooms/{room_id}/handoffs")
    async def issue_handoff(
        room_id: str,
        request: HandoffIssueRequest,
        session_id: str | None = Header(default=None, alias=SESSION_HEADER),
    ) -> JSONResponse:
        session = require_session(session_id, room_id)
        if isinstance(session, JSONResponse):
            return session
        try:
            current_version = int(reconnect.current_version(room_id))
            if request.cursor > current_version:
                raise HandoffError(
                    "HANDOFF_CURSOR_AHEAD",
                    "handoff cursor exceeds the authoritative room version",
                    details={"cursor": request.cursor, "current_version": current_version},
                )
            result = handoffs.issue(
                room_id=room_id,
                session_id=session.session_id,
                actor_member_id=session.actor_member_id,
                source_device_id=request.source_device_id,
                target_device_class=request.target_device_class,
                cursor=request.cursor,
                ttl_seconds=request.ttl_seconds,
            )
            return JSONResponse(status_code=201, content={**result, "expires_at": result["expires_at"].isoformat()})
        except HandoffError as error:
            return error_response(error)

    @router.post("/api/worldops/handoffs/consume")
    async def consume_handoff(request: HandoffConsumeRequest) -> JSONResponse:
        session = require_session(request.session_id, request.room_id)
        if isinstance(session, JSONResponse):
            return session
        try:
            result = handoffs.consume(**request.model_dump())
            return JSONResponse(status_code=200, content={**result, "consumed_at": result["consumed_at"].isoformat()})
        except HandoffError as error:
            return error_response(error)

    @router.post("/api/worldops/rooms/{room_id}/reconnect-plans")
    async def reconnect_plan(
        room_id: str,
        request: ReconnectPlanRequest,
        session_id: str | None = Header(default=None, alias=SESSION_HEADER),
    ) -> JSONResponse:
        session = require_session(session_id, room_id)
        if isinstance(session, JSONResponse):
            return session
        try:
            plan = reconnect.plan(
                room_id=room_id,
                session_id=session.session_id,
                cursor=request.cursor,
                delivery_window=request.delivery_window,
            )
            payload = {
                **plan.__dict__,
                "events": [event.model_dump(mode="json") if hasattr(event, "model_dump") else event for event in plan.events],
                "snapshot": plan.snapshot.model_dump(mode="json") if hasattr(plan.snapshot, "model_dump") else plan.snapshot,
            }
            return JSONResponse(status_code=200, content=payload)
        except ReconnectError as error:
            return error_response(error)

    @router.post("/api/worldops/rooms/{room_id}/reconnect-acks")
    async def reconnect_ack(
        room_id: str,
        request: ReconnectAckRequest,
        session_id: str | None = Header(default=None, alias=SESSION_HEADER),
    ) -> JSONResponse:
        session = require_session(session_id, room_id)
        if isinstance(session, JSONResponse):
            return session
        try:
            return JSONResponse(status_code=200, content=reconnect.acknowledge(room_id=room_id, session_id=session.session_id, cursor=request.cursor))
        except ReconnectError as error:
            return error_response(error)

    return router
