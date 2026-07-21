SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE
        @room_id UNIQUEIDENTIFIER = NEWID(),
        @session_id UNIQUEIDENTIFIER = NEWID(),
        @command_id UNIQUEIDENTIFIER = NEWID(),
        @event_id UNIQUEIDENTIFIER = NEWID(),
        @receipt_id UNIQUEIDENTIFIER,
        @result_status NVARCHAR(16),
        @result_version BIGINT,
        @error_code NVARCHAR(64),
        @state_json NVARCHAR(MAX) = N'{"messages":[],"tokens":{}}',
        @state_hash CHAR(64) = REPLICATE('0', 64),
        @payload_json NVARCHAR(MAX) = N'{"text":"synthetic","channel":"ic"}',
        @payload_hash CHAR(64) = REPLICATE('1', 64),
        @fingerprint CHAR(64) = REPLICATE('2', 64),
        @event_payload_json NVARCHAR(MAX) = N'{"message_id":"synthetic","text":"synthetic"}',
        @event_payload_hash CHAR(64) = REPLICATE('3', 64),
        @next_state_json NVARCHAR(MAX) = N'{"messages":[{"message_id":"synthetic","text":"synthetic"}],"tokens":{}}',
        @next_state_hash CHAR(64) = REPLICATE('4', 64);

    INSERT INTO wop.Room(room_id, room_code, schema_version, state_json, state_hash)
    VALUES (@room_id, CONCAT(N'SYN-', CONVERT(NVARCHAR(36), @room_id)), N'1', @state_json, @state_hash);

    INSERT INTO wop.Client_Session(session_id, room_id, actor_member_id, capabilities_json)
    VALUES (@session_id, @room_id, N'SYN-GM', N'["chat.send","room.read","snapshot.request"]');

    EXEC wop.usp_Append_Room_Command_Event
        @command_id = @command_id,
        @idempotency_key = N'synthetic-idempotency-1',
        @room_id = @room_id,
        @session_id = @session_id,
        @actor_member_id = N'SYN-GM',
        @command_type = N'room.message.append',
        @expected_version = 0,
        @payload_json = @payload_json,
        @payload_hash = @payload_hash,
        @fingerprint = @fingerprint,
        @event_id = @event_id,
        @event_type = N'room.message.appended',
        @event_payload_json = @event_payload_json,
        @event_payload_hash = @event_payload_hash,
        @next_state_json = @next_state_json,
        @next_state_hash = @next_state_hash,
        @result_status = @result_status OUTPUT,
        @result_version = @result_version OUTPUT,
        @error_code = @error_code OUTPUT,
        @receipt_id = @receipt_id OUTPUT;

    IF @result_status <> N'accepted' OR @result_version <> 1 OR @error_code IS NOT NULL
        THROW 51200, 'synthetic accepted command failed', 1;

    DECLARE @duplicate_status NVARCHAR(16), @duplicate_version BIGINT, @duplicate_error NVARCHAR(64), @duplicate_receipt UNIQUEIDENTIFIER;
    EXEC wop.usp_Append_Room_Command_Event
        @command_id = @command_id,
        @idempotency_key = N'synthetic-idempotency-1',
        @room_id = @room_id,
        @session_id = @session_id,
        @actor_member_id = N'SYN-GM',
        @command_type = N'room.message.append',
        @expected_version = 0,
        @payload_json = @payload_json,
        @payload_hash = @payload_hash,
        @fingerprint = @fingerprint,
        @event_id = @event_id,
        @event_type = N'room.message.appended',
        @event_payload_json = @event_payload_json,
        @event_payload_hash = @event_payload_hash,
        @next_state_json = @next_state_json,
        @next_state_hash = @next_state_hash,
        @result_status = @duplicate_status OUTPUT,
        @result_version = @duplicate_version OUTPUT,
        @error_code = @duplicate_error OUTPUT,
        @receipt_id = @duplicate_receipt OUTPUT;

    IF @duplicate_status <> N'duplicate' OR @duplicate_version <> 1
        THROW 51201, 'synthetic duplicate command failed', 1;

    DECLARE @conflict_status NVARCHAR(16), @conflict_version BIGINT, @conflict_error NVARCHAR(64), @conflict_receipt UNIQUEIDENTIFIER;
    EXEC wop.usp_Append_Room_Command_Event
        @command_id = NEWID(),
        @idempotency_key = N'synthetic-idempotency-2',
        @room_id = @room_id,
        @session_id = @session_id,
        @actor_member_id = N'SYN-GM',
        @command_type = N'room.message.append',
        @expected_version = 0,
        @payload_json = @payload_json,
        @payload_hash = @payload_hash,
        @fingerprint = REPLICATE('5', 64),
        @event_id = NEWID(),
        @event_type = N'room.message.appended',
        @event_payload_json = @event_payload_json,
        @event_payload_hash = @event_payload_hash,
        @next_state_json = @next_state_json,
        @next_state_hash = @next_state_hash,
        @result_status = @conflict_status OUTPUT,
        @result_version = @conflict_version OUTPUT,
        @error_code = @conflict_error OUTPUT,
        @receipt_id = @conflict_receipt OUTPUT;

    IF @conflict_status <> N'conflict' OR @conflict_version <> 1 OR @conflict_error <> N'VERSION_CONFLICT'
        THROW 51202, 'synthetic version conflict failed', 1;

    DECLARE @snapshot_id UNIQUEIDENTIFIER = NEWID();
    EXEC wop.usp_Create_Room_Snapshot
        @snapshot_id = @snapshot_id,
        @room_id = @room_id,
        @session_id = @session_id,
        @expected_version = 1,
        @schema_version = N'1',
        @state_json = @next_state_json,
        @state_hash = @next_state_hash;

    IF (SELECT COUNT(*) FROM wop.Room_Event WHERE room_id = @room_id) <> 1
        THROW 51203, 'synthetic event count is incorrect', 1;
    IF (SELECT current_version FROM wop.Room WHERE room_id = @room_id) <> 1
        THROW 51204, 'synthetic room version is incorrect', 1;
    IF (SELECT COUNT(*) FROM wop.Room_Snapshot WHERE room_id = @room_id AND authoritative = 1) <> 1
        THROW 51205, 'synthetic snapshot was not persisted', 1;

    SELECT
        N'passed' AS dry_run_status,
        @result_status AS accepted_status,
        @duplicate_status AS duplicate_status,
        @conflict_status AS conflict_status,
        CAST(0 AS BIT) AS formal_runtime_allowed;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
