from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "database/migrations/001_wop_authoritative_runtime.sql"
VALIDATION = ROOT / "database/validation/001_wop_authoritative_runtime_validation.sql"
DRY_RUN = ROOT / "database/synthetic/001_wop_authoritative_runtime_dry_run.sql"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_sql_contract_contains_all_authoritative_objects() -> None:
    sql = read(MIGRATION)
    required = [
        "wop.Room",
        "wop.Command_Type",
        "wop.Client_Session",
        "wop.Room_Command",
        "wop.Room_Event",
        "wop.Room_Snapshot",
        "wop.Sync_Cursor",
        "wop.Operation_Receipt",
        "wop.usp_Append_Room_Command_Event",
        "wop.usp_Create_Room_Snapshot",
        "wop.usp_Read_Room_Events",
    ]
    for item in required:
        assert item in sql


def test_sql_contract_is_additive_and_forbids_formal_runtime() -> None:
    combined = "\n".join(read(path) for path in [MIGRATION, VALIDATION, DRY_RUN])
    assert re.search(r"\bDROP\s+(?:TABLE|SCHEMA|PROCEDURE|DATABASE)\b", combined, re.I) is None
    assert re.search(r"\bTRUNCATE\s+TABLE\b", combined, re.I) is None
    assert "formal_runtime_allowed = 0" in combined
    assert "authoritative = 1" in combined
    assert "ROLLBACK TRANSACTION" in read(DRY_RUN)


def test_sql_command_contract_has_concurrency_idempotency_and_append_only_guards() -> None:
    sql = read(MIGRATION)
    assert "UQ_wop_Room_Command_idempotency" in sql
    assert "UQ_wop_Room_Event_version" in sql
    assert "WITH (UPDLOCK, HOLDLOCK)" in sql
    assert "VERSION_CONFLICT" in sql
    assert "IDEMPOTENCY_OR_COMMAND_ID_REUSED" in sql
    assert "current_version = @result_version" in sql
    assert "INSERT INTO wop.Room_Event" in sql
    assert re.search(r"UPDATE\s+wop\.Room_Event", sql, re.I) is None
    assert re.search(r"DELETE\s+FROM\s+wop\.Room_Event", sql, re.I) is None
