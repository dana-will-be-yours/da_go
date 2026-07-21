SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

DECLARE
    @room_id UNIQUEIDENTIFIER = NEWID(),
    @session_id UNIQUEIDENTIFIER = NEWID(),
    @snapshot_id UNIQUEIDENTIFIER = NEWID(),
    @handoff_id UNIQUEIDENTIFIER = NEWID(),
    @reconnect_receipt_id UNIQUEIDENTIFIER = NEWID(),
    @rebuild_receipt_id UNIQUEIDENTIFIER = NEWID(),
    @offline_receipt_id UNIQUEIDENTIFIER = NEWID(),
    @command_id UNIQUEIDENTIFIER = NEWID(),
    @replacement_command_id UNIQUEIDENTIFIER = NEWID(),
    @token_hash CHAR(64) = REPLICATE('a', 64),
    @state_hash CHAR(64) = REPLICATE('b', 64),
    @body_hash CHAR(64) = REPLICATE('c', 64);

INSERT INTO wop.Room
(
    room_id,
    room_code,
    schema_version,
    current_version,
    state_json,
    state_hash,
    room_status
)
VALUES
(
    @room_id,
    N'P04-SYNTHETIC-' + CONVERT(NVARCHAR(36), @room_id),
    N'1',
    0,
    N'{"active_scene_id":null,"messages":[],"tokens":{}}',
    @state_hash,
    N'open'
);

INSERT INTO wop.Client_Session
(
    session_id,
    room_id,
    actor_member_id,
    capabilities_json,
    session_status,
    expires_at
)
VALUES
(
    @session_id,
    @room_id,
    N'P04-SYNTHETIC-MEMBER',
    N'["room.read","snapshot.request"]',
    N'active',
    DATEADD(MINUTE, 10, SYSUTCDATETIME())
);

INSERT INTO wop.Room_Snapshot
(
    snapshot_id,
    room_id,
    room_version,
    schema_version,
    state_json,
    state_hash,
    authoritative,
    created_by_session_id
)
VALUES
(
    @snapshot_id,
    @room_id,
    0,
    N'1',
    N'{"active_scene_id":null,"messages":[],"tokens":{}}',
    @state_hash,
    1,
    @session_id
);

EXEC wop.usp_Issue_Device_Handoff
    @handoff_id = @handoff_id,
    @token_hash = @token_hash,
    @room_id = @room_id,
    @session_id = @session_id,
    @source_device_id = N'DESKTOP-SYNTHETIC',
    @target_device_class = N'mobile',
    @cursor = 0,
    @ttl_seconds = 120;

EXEC wop.usp_Consume_Device_Handoff
    @token_hash = @token_hash,
    @room_id = @room_id,
    @session_id = @session_id,
    @target_device_id = N'MOBILE-SYNTHETIC',
    @target_device_class = N'mobile';

EXEC wop.usp_Record_Reconnect_Plan
    @reconnect_receipt_id = @reconnect_receipt_id,
    @room_id = @room_id,
    @session_id = @session_id,
    @requested_cursor = 0,
    @authoritative_version = 0,
    @delivery_mode = N'events',
    @snapshot_id = NULL,
    @delivered_from_version = 0,
    @delivered_to_version = 0,
    @event_count = 0,
    @has_more = 0,
    @reconnect_status = N'planned';

EXEC wop.usp_Acknowledge_Reconnect
    @reconnect_receipt_id = @reconnect_receipt_id,
    @acknowledged_cursor = 0;

EXEC wop.usp_Record_Snapshot_Rebuild
    @rebuild_receipt_id = @rebuild_receipt_id,
    @room_id = @room_id,
    @source_snapshot_id = @snapshot_id,
    @source_room_version = 0,
    @target_room_version = 0,
    @source_schema_version = N'1',
    @target_schema_version = N'1',
    @event_count = 0,
    @migration_path_json = N'[]',
    @result_state_hash = @state_hash,
    @rebuild_status = N'passed';

EXEC wop.usp_Record_Offline_Operation_Receipt
    @offline_receipt_id = @offline_receipt_id,
    @room_id = @room_id,
    @session_id = @session_id,
    @command_id = @command_id,
    @idempotency_key = N'P04-SYNTHETIC-IDEMPOTENCY',
    @client_sequence = 0,
    @expected_version = 0,
    @operation_status = N'superseded',
    @superseded_by_command_id = @replacement_command_id,
    @body_hash = @body_hash;

IF NOT EXISTS
(
    SELECT 1
    FROM wop.Device_Handoff
    WHERE handoff_id = @handoff_id
      AND handoff_status = N'consumed'
      AND formal_runtime_allowed = 0
)
    THROW 51400, 'synthetic handoff did not reach consumed state', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM wop.Reconnect_Receipt
    WHERE reconnect_receipt_id = @reconnect_receipt_id
      AND reconnect_status = N'acknowledged'
      AND acknowledged_cursor = 0
      AND formal_runtime_allowed = 0
)
    THROW 51401, 'synthetic reconnect receipt was not acknowledged', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM wop.Snapshot_Rebuild_Receipt
    WHERE rebuild_receipt_id = @rebuild_receipt_id
      AND rebuild_status = N'passed'
      AND formal_runtime_allowed = 0
)
    THROW 51402, 'synthetic snapshot rebuild receipt was not created', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM wop.Offline_Operation_Receipt
    WHERE offline_receipt_id = @offline_receipt_id
      AND operation_status = N'superseded'
      AND superseded_by_command_id = @replacement_command_id
      AND formal_runtime_allowed = 0
)
    THROW 51403, 'synthetic offline operation receipt was not created', 1;

SELECT
    N'passed' AS synthetic_status,
    @room_id AS room_id,
    @session_id AS session_id,
    @handoff_id AS handoff_id,
    @reconnect_receipt_id AS reconnect_receipt_id,
    @rebuild_receipt_id AS rebuild_receipt_id,
    0 AS formal_runtime_allowed;

ROLLBACK TRANSACTION;
GO
