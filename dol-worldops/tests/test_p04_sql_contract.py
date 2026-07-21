from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "database/migrations/003_wop_snapshot_migration_handoff.sql"
VALIDATION = ROOT / "database/validation/003_wop_snapshot_migration_handoff_validation.sql"
SYNTHETIC = ROOT / "database/synthetic/003_wop_snapshot_migration_handoff_dry_run.sql"


def read(path: Path) -> str:
    content = path.read_text(encoding="utf-8")
    assert "\x00" not in content
    assert "\ufffd" not in content
    return content


def test_p04_sql_files_exist_and_are_additive() -> None:
    migration = read(MIGRATION)
    validation = read(VALIDATION)
    synthetic = read(SYNTHETIC)
    combined = "\n".join([migration, validation, synthetic]).upper()
    assert ("DROP" + " TABLE") not in combined
    assert ("TRUNCATE" + " TABLE") not in combined
    assert ("DELETE" + " FROM") not in combined
    assert ("ALTER" + " TABLE") not in migration.upper()
    assert "ROLLBACK TRANSACTION" in synthetic.upper()


def test_p04_migration_defines_required_tables_procedures_and_safety_constraints() -> None:
    migration = read(MIGRATION)
    required = [
        "wop.Schema_Migration",
        "wop.Snapshot_Rebuild_Receipt",
        "wop.Device_Handoff",
        "wop.Reconnect_Receipt",
        "wop.Offline_Operation_Receipt",
        "wop.usp_Issue_Device_Handoff",
        "wop.usp_Consume_Device_Handoff",
        "wop.usp_Record_Snapshot_Rebuild",
        "wop.usp_Record_Reconnect_Plan",
        "wop.usp_Acknowledge_Reconnect",
        "wop.usp_Record_Offline_Operation_Receipt",
    ]
    for name in required:
        assert name in migration
    assert "token_hash CHAR(64)" in migration
    assert "handoff_token" not in migration
    assert migration.count("formal_runtime_allowed BIT NOT NULL") >= 5
    assert migration.count("formal_runtime_allowed = 0") >= 5
    assert "WITH (UPDLOCK, HOLDLOCK)" in migration
    assert "@cursor > @room_version" in migration


def test_p04_validation_checks_plaintext_tokens_and_trusted_constraints() -> None:
    validation = read(VALIDATION)
    assert "is_not_trusted = 1" in validation
    assert "handoff_token" in validation
    assert "plaintext handoff credentials" in validation
    assert "formal_runtime_allowed <> 0" in validation


def test_p04_synthetic_dry_run_exercises_all_procedures_before_rollback() -> None:
    synthetic = read(SYNTHETIC)
    required_calls = [
        "EXEC wop.usp_Issue_Device_Handoff",
        "EXEC wop.usp_Consume_Device_Handoff",
        "EXEC wop.usp_Record_Reconnect_Plan",
        "EXEC wop.usp_Acknowledge_Reconnect",
        "EXEC wop.usp_Record_Snapshot_Rebuild",
        "EXEC wop.usp_Record_Offline_Operation_Receipt",
    ]
    for call in required_calls:
        assert call in synthetic
    assert synthetic.index("BEGIN TRANSACTION") < synthetic.index("ROLLBACK TRANSACTION")
    assert "formal_runtime_allowed = 0" in synthetic
