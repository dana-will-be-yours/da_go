from __future__ import annotations

from collections import deque
from collections.abc import Callable
from copy import deepcopy
from dataclasses import dataclass
from typing import Any

from .canonical import sha256_hex


class SchemaMigrationError(ValueError):
    def __init__(self, code: str, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.details = details or {}


MigrationFunction = Callable[[dict[str, Any]], dict[str, Any]]


@dataclass(frozen=True)
class MigrationStep:
    migration_id: str
    from_version: str
    to_version: str
    migrate: MigrationFunction


@dataclass(frozen=True)
class MigrationReceipt:
    source_version: str
    target_version: str
    path: tuple[str, ...]
    migration_ids: tuple[str, ...]
    source_hash: str
    target_hash: str
    formal_runtime_allowed: bool = False
    canon_write_allowed: bool = False


class SchemaMigrationRegistry:
    """Deterministic, explicit schema migration graph.

    Migrations receive and return deep-copied dictionaries. Registration does not imply
    deployment approval; the registry only provides a verifiable transformation path.
    """

    def __init__(self) -> None:
        self._steps: dict[tuple[str, str], MigrationStep] = {}
        self._outgoing: dict[str, set[str]] = {}
        self._sealed = False

    def register(
        self,
        migration_id: str,
        from_version: str,
        to_version: str,
        migrate: MigrationFunction,
    ) -> MigrationStep:
        if self._sealed:
            raise SchemaMigrationError("MIGRATION_REGISTRY_SEALED", "migration registry is sealed")
        for name, value in {
            "migration_id": migration_id,
            "from_version": from_version,
            "to_version": to_version,
        }.items():
            if not isinstance(value, str) or not value.strip() or "\n" in value or "\r" in value:
                raise SchemaMigrationError("INVALID_MIGRATION_IDENTIFIER", f"{name} must be a non-empty single-line string")
        if from_version == to_version:
            raise SchemaMigrationError("MIGRATION_SELF_LOOP", "migration source and target versions must differ")
        if not callable(migrate):
            raise SchemaMigrationError("INVALID_MIGRATION_FUNCTION", "migrate must be callable")
        key = (from_version, to_version)
        if key in self._steps:
            raise SchemaMigrationError("DUPLICATE_MIGRATION_EDGE", f"migration edge already exists: {from_version}->{to_version}")
        if any(step.migration_id == migration_id for step in self._steps.values()):
            raise SchemaMigrationError("DUPLICATE_MIGRATION_ID", f"migration id already exists: {migration_id}")
        step = MigrationStep(migration_id, from_version, to_version, migrate)
        self._steps[key] = step
        self._outgoing.setdefault(from_version, set()).add(to_version)
        return step

    def seal(self) -> None:
        self._sealed = True

    def path(self, source_version: str, target_version: str) -> tuple[MigrationStep, ...]:
        if source_version == target_version:
            return ()
        queue: deque[tuple[str, tuple[MigrationStep, ...]]] = deque([(source_version, ())])
        visited = {source_version}
        while queue:
            version, steps = queue.popleft()
            for next_version in sorted(self._outgoing.get(version, set())):
                if next_version in visited:
                    continue
                step = self._steps[(version, next_version)]
                next_steps = (*steps, step)
                if next_version == target_version:
                    return next_steps
                visited.add(next_version)
                queue.append((next_version, next_steps))
        raise SchemaMigrationError(
            "MIGRATION_PATH_NOT_FOUND",
            f"no migration path from {source_version} to {target_version}",
            details={"source_version": source_version, "target_version": target_version},
        )

    def migrate(
        self,
        state: dict[str, Any],
        source_version: str,
        target_version: str,
    ) -> tuple[dict[str, Any], MigrationReceipt]:
        if not isinstance(state, dict):
            raise SchemaMigrationError("INVALID_MIGRATION_STATE", "state must be a dictionary")
        source = deepcopy(state)
        current = deepcopy(state)
        steps = self.path(source_version, target_version)
        versions = [source_version]
        migration_ids: list[str] = []
        for step in steps:
            result = step.migrate(deepcopy(current))
            if not isinstance(result, dict):
                raise SchemaMigrationError(
                    "INVALID_MIGRATION_RESULT",
                    f"migration {step.migration_id} did not return a dictionary",
                )
            current = deepcopy(result)
            versions.append(step.to_version)
            migration_ids.append(step.migration_id)
        receipt = MigrationReceipt(
            source_version=source_version,
            target_version=target_version,
            path=tuple(versions),
            migration_ids=tuple(migration_ids),
            source_hash=sha256_hex(source),
            target_hash=sha256_hex(current),
        )
        return current, receipt
