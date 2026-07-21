SET NOCOUNT ON;

DECLARE @errors TABLE
(
    check_code NVARCHAR(64) NOT NULL,
    detail NVARCHAR(4000) NOT NULL
);

IF SCHEMA_ID(N'wop') IS NULL
    INSERT INTO @errors VALUES (N'WOP_SCHEMA_MISSING', N'wop schema does not exist');

DECLARE @required TABLE(object_name SYSNAME NOT NULL, object_type CHAR(2) NOT NULL);
INSERT INTO @required(object_name, object_type)
VALUES
    (N'wop.Room', N'U'),
    (N'wop.Command_Type', N'U'),
    (N'wop.Client_Session', N'U'),
    (N'wop.Room_Command', N'U'),
    (N'wop.Room_Event', N'U'),
    (N'wop.Room_Snapshot', N'U'),
    (N'wop.Sync_Cursor', N'U'),
    (N'wop.Operation_Receipt', N'U'),
    (N'wop.usp_Append_Room_Command_Event', N'P'),
    (N'wop.usp_Create_Room_Snapshot', N'P'),
    (N'wop.usp_Read_Room_Events', N'P');

INSERT INTO @errors(check_code, detail)
SELECT N'OBJECT_MISSING', CONCAT(object_name, N' is missing or has the wrong type')
FROM @required
WHERE OBJECT_ID(object_name, object_type) IS NULL;

IF OBJECT_ID(N'wop.Room_Event', N'U') IS NOT NULL
BEGIN
    IF EXISTS
    (
        SELECT room_id
        FROM wop.Room_Event
        GROUP BY room_id, room_version
        HAVING COUNT(*) > 1
    )
        INSERT INTO @errors VALUES (N'DUPLICATE_EVENT_VERSION', N'multiple events share a room version');
END;

IF OBJECT_ID(N'wop.Room_Command', N'U') IS NOT NULL
BEGIN
    IF EXISTS
    (
        SELECT room_id
        FROM wop.Room_Command
        GROUP BY room_id, idempotency_key
        HAVING COUNT(*) > 1
    )
        INSERT INTO @errors VALUES (N'DUPLICATE_IDEMPOTENCY_KEY', N'multiple commands share a room idempotency key');
END;

IF OBJECT_ID(N'wop.Room', N'U') IS NOT NULL AND OBJECT_ID(N'wop.Room_Event', N'U') IS NOT NULL
BEGIN
    IF EXISTS
    (
        SELECT 1
        FROM wop.Room AS r
        OUTER APPLY
        (
            SELECT MAX(e.room_version) AS max_event_version
            FROM wop.Room_Event AS e
            WHERE e.room_id = r.room_id
        ) AS x
        WHERE r.current_version <> ISNULL(x.max_event_version, 0)
    )
        INSERT INTO @errors VALUES (N'ROOM_EVENT_VERSION_MISMATCH', N'room current_version differs from the event stream');
END;

IF OBJECT_ID(N'wop.Room_Snapshot', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM wop.Room_Snapshot WHERE authoritative <> 1)
        INSERT INTO @errors VALUES (N'NONAUTHORITATIVE_SNAPSHOT', N'a persisted room snapshot is not authoritative');
END;

IF OBJECT_ID(N'wop.Operation_Receipt', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM wop.Operation_Receipt WHERE formal_runtime_allowed <> 0)
        INSERT INTO @errors VALUES (N'FORMAL_RUNTIME_FLAG_VIOLATION', N'a development receipt enables formal runtime');
END;

IF EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id IN
    (
        OBJECT_ID(N'wop.Client_Session'),
        OBJECT_ID(N'wop.Room_Command'),
        OBJECT_ID(N'wop.Room_Event'),
        OBJECT_ID(N'wop.Room_Snapshot'),
        OBJECT_ID(N'wop.Sync_Cursor')
    )
      AND is_not_trusted = 1
)
    INSERT INTO @errors VALUES (N'UNTRUSTED_FOREIGN_KEY', N'one or more wop foreign keys are not trusted');

SELECT check_code, detail FROM @errors ORDER BY check_code, detail;

IF EXISTS (SELECT 1 FROM @errors)
    THROW 51100, 'wop authoritative runtime validation failed', 1;

DECLARE
    @room_count BIGINT = CASE WHEN OBJECT_ID(N'wop.Room', N'U') IS NULL THEN 0 ELSE (SELECT COUNT_BIG(*) FROM wop.Room) END,
    @command_count BIGINT = CASE WHEN OBJECT_ID(N'wop.Room_Command', N'U') IS NULL THEN 0 ELSE (SELECT COUNT_BIG(*) FROM wop.Room_Command) END,
    @event_count BIGINT = CASE WHEN OBJECT_ID(N'wop.Room_Event', N'U') IS NULL THEN 0 ELSE (SELECT COUNT_BIG(*) FROM wop.Room_Event) END,
    @snapshot_count BIGINT = CASE WHEN OBJECT_ID(N'wop.Room_Snapshot', N'U') IS NULL THEN 0 ELSE (SELECT COUNT_BIG(*) FROM wop.Room_Snapshot) END;

SELECT
    N'passed' AS validation_status,
    @room_count AS room_count,
    @command_count AS command_count,
    @event_count AS event_count,
    @snapshot_count AS snapshot_count,
    CAST(0 AS BIT) AS formal_runtime_allowed;
