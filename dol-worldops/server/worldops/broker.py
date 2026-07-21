from __future__ import annotations

import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import AsyncIterator

from .models import EventRecord


class WorldOpsEventBroker:
    """Process-local event broker used by the reference API and contract tests.

    SQL Server remains authoritative. A formal multi-process deployment must replace
    this broker with a durable pub/sub adapter while preserving room_version cursors.
    """

    def __init__(self, *, queue_size: int = 1000) -> None:
        self.queue_size = max(1, int(queue_size))
        self._subscribers: dict[str, set[asyncio.Queue[EventRecord]]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def publish(self, event: EventRecord) -> None:
        async with self._lock:
            queues = list(self._subscribers.get(event.room_id, set()))
        stale: list[asyncio.Queue[EventRecord]] = []
        for queue in queues:
            try:
                queue.put_nowait(event.model_copy(deep=True))
            except asyncio.QueueFull:
                stale.append(queue)
        if stale:
            async with self._lock:
                for queue in stale:
                    self._subscribers[event.room_id].discard(queue)

    @asynccontextmanager
    async def subscribe(self, room_id: str) -> AsyncIterator[asyncio.Queue[EventRecord]]:
        queue: asyncio.Queue[EventRecord] = asyncio.Queue(maxsize=self.queue_size)
        async with self._lock:
            self._subscribers[room_id].add(queue)
        try:
            yield queue
        finally:
            async with self._lock:
                self._subscribers[room_id].discard(queue)
                if not self._subscribers[room_id]:
                    self._subscribers.pop(room_id, None)

    async def subscriber_count(self, room_id: str) -> int:
        async with self._lock:
            return len(self._subscribers.get(room_id, set()))
