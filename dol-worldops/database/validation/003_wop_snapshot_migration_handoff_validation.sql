SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

DECLARE @missing TABLE(object_name SYSNAME NOT NULL);

INSERT INTO @missing(object_name)
SELECT required.object_name
FROM
(
    VALUES
        (N'wop.Schema_Migration'),
        (N'wop.Snapshot_Rebuild_Receipt'),
        (N'wop.Device_Handoff'),
        (N'wop.Reconnect_Receipt'),
        (N'wop.Offline_Operation_Receipt'),
        (N'wop.usp_Issue_Device_Handoff'),
        (N'wop.usp_Consume_Device_Handoff'),
        (N'wop.usp_Record_Snapshot_Rebuild'),
        (N'wop.usp_Record_Reconnect_Plan'),
        (N'wop.usp_Acknowledge_Reconnect'),
        (N'wop.usp_Record_Offline_Operation_Receipt')
) AS required(object_name)
WHERE OBJECT_ID(required.object_name) IS NULL;

IF EXISTS (SELECT 1 FROM @missing)
BEGIN
    SELECT object_name AS missing_object FROM @missing ORDER BY object_name;
    THROW 51300, 'P04 required SQL objects are missing', 1;
END;

IF EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id IN
    (
        OBJECT_ID(N'wop.Schema_Migration'),
        OBJECT_ID(N'wop.Snapshot_Rebuild_Receipt'),
        OBJECT_ID(N'wop.Device_Handoff'),
        OBJECT_ID(N'wop.Reconnect_Receipt'),
        OBJECT_ID(N'wop.Offline_Operation_Receipt')
    )
      AND is_not_trusted = 1
)
    THROW 51301, 'one or more P04 CHECK constraints are not trusted', 1;

IF EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id IN
    (
        OBJECT_ID(N'wop.Snapshot_Rebuild_Receipt'),
        OBJECT_ID(N'wop.Device_Handoff'),
        OBJECT_ID(N'wop.Reconnect_Receipt'),
        OBJECT_ID(N'wop.Offline_Operation_Receipt')
    )
      AND is_not_trusted = 1
)
    THROW 51302, 'one or more P04 foreign keys are not trusted', 1;

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'wop.Device_Handoff')
      AND name IN (N'handoff_token', N'token_plaintext', N'plaintext_token', N'access_code')
)
    THROW 51303, 'Device_Handoff must never retain plaintext handoff credentials', 1;

IF EXISTS (SELECT 1 FROM wop.Schema_Migration WHERE formal_runtime_allowed <> 0)
    THROW 51304, 'Schema_Migration contains an enabled formal runtime record', 1;
IF EXISTS (SELECT 1 FROM wop.Snapshot_Rebuild_Receipt WHERE formal_runtime_allowed <> 0)
    THROW 51305, 'Snapshot_Rebuild_Receipt contains an enabled formal runtime record', 1;
IF EXISTS (SELECT 1 FROM wop.Device_Handoff WHERE formal_runtime_allowed <> 0)
    THROW 51306, 'Device_Handoff contains an enabled formal runtime record', 1;
IF EXISTS (SELECT 1 FROM wop.Reconnect_Receipt WHERE formal_runtime_allowed <> 0)
    THROW 51307, 'Reconnect_Receipt contains an enabled formal runtime record', 1;
IF EXISTS (SELECT 1 FROM wop.Offline_Operation_Receipt WHERE formal_runtime_allowed <> 0)
    THROW 51308, 'Offline_Operation_Receipt contains an enabled formal runtime record', 1;

IF EXISTS
(
    SELECT 1
    FROM wop.Schema_Migration
    WHERE from_schema_version = to_schema_version
)
    THROW 51309, 'Schema_Migration contains a self-edge', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'wop.Device_Handoff')
      AND name = N'IX_wop_Device_Handoff_room_status_expiry'
)
    THROW 51310, 'Device_Handoff expiry index is missing', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'wop.Reconnect_Receipt')
      AND name = N'IX_wop_Reconnect_Receipt_session_created'
)
    THROW 51311, 'Reconnect receipt index is missing', 1;

SELECT
    N'passed' AS validation_status,
    0 AS formal_runtime_allowed,
    0 AS plaintext_handoff_token_columns,
    (SELECT COUNT_BIG(*) FROM wop.Schema_Migration) AS migration_count,
    (SELECT COUNT_BIG(*) FROM wop.Snapshot_Rebuild_Receipt) AS rebuild_receipt_count,
    (SELECT COUNT_BIG(*) FROM wop.Device_Handoff) AS handoff_count,
    (SELECT COUNT_BIG(*) FROM wop.Reconnect_Receipt) AS reconnect_receipt_count,
    (SELECT COUNT_BIG(*) FROM wop.Offline_Operation_Receipt) AS offline_receipt_count;
GO
