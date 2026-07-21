SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF SCHEMA_ID(N'wop') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA wop AUTHORIZATION dbo;');
END;
GO

IF OBJECT_ID(N'wop.Schema_Migration', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Schema_Migration
    (
        migration_id NVARCHAR(128) NOT NULL
            CONSTRAINT PK_wop_Schema_Migration PRIMARY KEY,
        from_schema_version NVARCHAR(32) NOT NULL,
        to_schema_version NVARCHAR(32) NOT NULL,
        implementation_hash CHAR(64) NOT NULL,
        migration_status NVARCHAR(16) NOT NULL
            CONSTRAINT DF_wop_Schema_Migration_status DEFAULT (N'active'),
        description NVARCHAR(1024) NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Schema_Migration_formal_runtime DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Schema_Migration_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_wop_Schema_Migration_edge UNIQUE (from_schema_version, to_schema_version),
        CONSTRAINT CK_wop_Schema_Migration_versions CHECK (from_schema_version <> to_schema_version),
        CONSTRAINT CK_wop_Schema_Migration_hash CHECK (LEN(implementation_hash) = 64),
        CONSTRAINT CK_wop_Schema_Migration_status CHECK (migration_status IN (N'active', N'retired')),
        CONSTRAINT CK_wop_Schema_Migration_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Snapshot_Rebuild_Receipt', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Snapshot_Rebuild_Receipt
    (
        rebuild_receipt_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Snapshot_Rebuild_Receipt PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        source_snapshot_id UNIQUEIDENTIFIER NOT NULL,
        source_room_version BIGINT NOT NULL,
        target_room_version BIGINT NOT NULL,
        source_schema_version NVARCHAR(32) NOT NULL,
        target_schema_version NVARCHAR(32) NOT NULL,
        event_count BIGINT NOT NULL,
        migration_path_json NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_wop_Snapshot_Rebuild_Receipt_path DEFAULT (N'[]'),
        result_state_hash CHAR(64) NULL,
        rebuild_status NVARCHAR(16) NOT NULL,
        error_code NVARCHAR(64) NULL,
        error_message NVARCHAR(1024) NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Snapshot_Rebuild_Receipt_formal_runtime DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Snapshot_Rebuild_Receipt_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_wop_Snapshot_Rebuild_Receipt_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Snapshot_Rebuild_Receipt_Snapshot
            FOREIGN KEY (source_snapshot_id) REFERENCES wop.Room_Snapshot(snapshot_id),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_versions CHECK
            (source_room_version >= 0 AND target_room_version >= source_room_version),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_event_count CHECK (event_count >= 0),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_path CHECK (ISJSON(migration_path_json) = 1),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_hash CHECK
            (result_state_hash IS NULL OR LEN(result_state_hash) = 64),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_status CHECK
            (rebuild_status IN (N'passed', N'failed')),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_error CHECK
            ((rebuild_status = N'passed' AND error_code IS NULL) OR rebuild_status = N'failed'),
        CONSTRAINT CK_wop_Snapshot_Rebuild_Receipt_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Device_Handoff', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Device_Handoff
    (
        handoff_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Device_Handoff PRIMARY KEY,
        token_hash CHAR(64) NOT NULL,
        room_id UNIQUEIDENTIFIER NOT NULL,
        session_id UNIQUEIDENTIFIER NOT NULL,
        actor_member_id NVARCHAR(128) NOT NULL,
        source_device_id NVARCHAR(128) NOT NULL,
        target_device_class NVARCHAR(64) NOT NULL,
        cursor BIGINT NOT NULL,
        handoff_status NVARCHAR(16) NOT NULL
            CONSTRAINT DF_wop_Device_Handoff_status DEFAULT (N'issued'),
        issued_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Device_Handoff_issued_at DEFAULT (SYSUTCDATETIME()),
        expires_at DATETIME2(3) NOT NULL,
        consumed_at DATETIME2(3) NULL,
        consumed_device_id NVARCHAR(128) NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Device_Handoff_formal_runtime DEFAULT (0),
        row_version ROWVERSION NOT NULL,
        CONSTRAINT UQ_wop_Device_Handoff_token_hash UNIQUE (token_hash),
        CONSTRAINT FK_wop_Device_Handoff_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Device_Handoff_Session
            FOREIGN KEY (session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT CK_wop_Device_Handoff_hash CHECK (LEN(token_hash) = 64),
        CONSTRAINT CK_wop_Device_Handoff_cursor CHECK (cursor >= 0),
        CONSTRAINT CK_wop_Device_Handoff_status CHECK
            (handoff_status IN (N'issued', N'consumed', N'revoked', N'expired')),
        CONSTRAINT CK_wop_Device_Handoff_expiry CHECK (expires_at > issued_at),
        CONSTRAINT CK_wop_Device_Handoff_consumption CHECK
            ((handoff_status = N'consumed' AND consumed_at IS NOT NULL AND consumed_device_id IS NOT NULL)
             OR (handoff_status <> N'consumed' AND consumed_at IS NULL AND consumed_device_id IS NULL)),
        CONSTRAINT CK_wop_Device_Handoff_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Reconnect_Receipt', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Reconnect_Receipt
    (
        reconnect_receipt_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Reconnect_Receipt PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        session_id UNIQUEIDENTIFIER NOT NULL,
        requested_cursor BIGINT NOT NULL,
        authoritative_version BIGINT NOT NULL,
        delivery_mode NVARCHAR(32) NOT NULL,
        snapshot_id UNIQUEIDENTIFIER NULL,
        delivered_from_version BIGINT NOT NULL,
        delivered_to_version BIGINT NOT NULL,
        event_count INT NOT NULL,
        has_more BIT NOT NULL,
        acknowledged_cursor BIGINT NULL,
        reconnect_status NVARCHAR(16) NOT NULL,
        error_code NVARCHAR(64) NULL,
        error_message NVARCHAR(1024) NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Reconnect_Receipt_formal_runtime DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Reconnect_Receipt_created_at DEFAULT (SYSUTCDATETIME()),
        acknowledged_at DATETIME2(3) NULL,
        row_version ROWVERSION NOT NULL,
        CONSTRAINT FK_wop_Reconnect_Receipt_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Reconnect_Receipt_Session
            FOREIGN KEY (session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT FK_wop_Reconnect_Receipt_Snapshot
            FOREIGN KEY (snapshot_id) REFERENCES wop.Room_Snapshot(snapshot_id),
        CONSTRAINT CK_wop_Reconnect_Receipt_cursors CHECK
            (requested_cursor >= 0
             AND authoritative_version >= requested_cursor
             AND delivered_from_version >= requested_cursor
             AND delivered_to_version >= delivered_from_version
             AND delivered_to_version <= authoritative_version
             AND (acknowledged_cursor IS NULL OR acknowledged_cursor BETWEEN requested_cursor AND delivered_to_version)),
        CONSTRAINT CK_wop_Reconnect_Receipt_event_count CHECK (event_count >= 0),
        CONSTRAINT CK_wop_Reconnect_Receipt_mode CHECK
            (delivery_mode IN (N'events', N'snapshot_then_events')),
        CONSTRAINT CK_wop_Reconnect_Receipt_status CHECK
            (reconnect_status IN (N'planned', N'acknowledged', N'rejected')),
        CONSTRAINT CK_wop_Reconnect_Receipt_snapshot_mode CHECK
            ((delivery_mode = N'snapshot_then_events' AND snapshot_id IS NOT NULL)
             OR (delivery_mode = N'events' AND snapshot_id IS NULL)),
        CONSTRAINT CK_wop_Reconnect_Receipt_ack CHECK
            ((reconnect_status = N'acknowledged' AND acknowledged_cursor IS NOT NULL AND acknowledged_at IS NOT NULL)
             OR reconnect_status <> N'acknowledged'),
        CONSTRAINT CK_wop_Reconnect_Receipt_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Offline_Operation_Receipt', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Offline_Operation_Receipt
    (
        offline_receipt_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Offline_Operation_Receipt PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        session_id UNIQUEIDENTIFIER NOT NULL,
        command_id UNIQUEIDENTIFIER NOT NULL,
        idempotency_key NVARCHAR(128) NOT NULL,
        client_sequence BIGINT NOT NULL,
        expected_version BIGINT NOT NULL,
        operation_status NVARCHAR(16) NOT NULL,
        superseded_by_command_id UNIQUEIDENTIFIER NULL,
        body_hash CHAR(64) NOT NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Offline_Operation_Receipt_formal_runtime DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Offline_Operation_Receipt_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_wop_Offline_Operation_Receipt_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Offline_Operation_Receipt_Session
            FOREIGN KEY (session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_sequence CHECK (client_sequence >= 0),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_expected_version CHECK (expected_version >= 0),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_status CHECK
            (operation_status IN (N'queued', N'sending', N'acked', N'conflict', N'rejected', N'superseded')),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_superseded CHECK
            ((operation_status = N'superseded' AND superseded_by_command_id IS NOT NULL)
             OR (operation_status <> N'superseded' AND superseded_by_command_id IS NULL)),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_hash CHECK (LEN(body_hash) = 64),
        CONSTRAINT CK_wop_Offline_Operation_Receipt_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'wop.Device_Handoff')
      AND name = N'IX_wop_Device_Handoff_room_status_expiry'
)
BEGIN
    CREATE INDEX IX_wop_Device_Handoff_room_status_expiry
        ON wop.Device_Handoff(room_id, handoff_status, expires_at)
        INCLUDE (session_id, cursor, target_device_class);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'wop.Reconnect_Receipt')
      AND name = N'IX_wop_Reconnect_Receipt_session_created'
)
BEGIN
    CREATE INDEX IX_wop_Reconnect_Receipt_session_created
        ON wop.Reconnect_Receipt(session_id, room_id, created_at DESC)
        INCLUDE (requested_cursor, delivered_to_version, acknowledged_cursor, reconnect_status);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'wop.Offline_Operation_Receipt')
      AND name = N'IX_wop_Offline_Operation_Receipt_command_created'
)
BEGIN
    CREATE INDEX IX_wop_Offline_Operation_Receipt_command_created
        ON wop.Offline_Operation_Receipt(room_id, command_id, created_at)
        INCLUDE (session_id, idempotency_key, operation_status, expected_version);
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Issue_Device_Handoff
    @handoff_id UNIQUEIDENTIFIER,
    @token_hash CHAR(64),
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @source_device_id NVARCHAR(128),
    @target_device_class NVARCHAR(64),
    @cursor BIGINT,
    @ttl_seconds INT = 120
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF LEN(@token_hash) <> 64
        THROW 51200, 'token_hash must contain 64 characters', 1;
    IF @cursor < 0
        THROW 51201, 'cursor must be non-negative', 1;
    IF @ttl_seconds < 10 OR @ttl_seconds > 600
        THROW 51202, 'ttl_seconds must be between 10 and 600', 1;
    IF NULLIF(LTRIM(RTRIM(@source_device_id)), N'') IS NULL
        THROW 51203, 'source_device_id is required', 1;
    IF NULLIF(LTRIM(RTRIM(@target_device_class)), N'') IS NULL
        THROW 51204, 'target_device_class is required', 1;

    DECLARE
        @room_version BIGINT,
        @session_room_id UNIQUEIDENTIFIER,
        @actor_member_id NVARCHAR(128),
        @session_status NVARCHAR(16),
        @expires_at DATETIME2(3) = DATEADD(SECOND, @ttl_seconds, SYSUTCDATETIME());

    BEGIN TRANSACTION;

    SELECT @room_version = current_version
    FROM wop.Room WITH (UPDLOCK, HOLDLOCK)
    WHERE room_id = @room_id;

    IF @room_version IS NULL
        THROW 51205, 'room does not exist', 1;
    IF @cursor > @room_version
        THROW 51206, 'handoff cursor exceeds authoritative room version', 1;

    SELECT
        @session_room_id = room_id,
        @actor_member_id = actor_member_id,
        @session_status = session_status
    FROM wop.Client_Session WITH (UPDLOCK, HOLDLOCK)
    WHERE session_id = @session_id
      AND (expires_at IS NULL OR expires_at > SYSUTCDATETIME());

    IF @session_room_id IS NULL OR @session_status <> N'active'
        THROW 51207, 'session is missing, expired, or inactive', 1;
    IF @session_room_id <> @room_id
        THROW 51208, 'session is not bound to the room', 1;

    INSERT INTO wop.Device_Handoff
    (
        handoff_id,
        token_hash,
        room_id,
        session_id,
        actor_member_id,
        source_device_id,
        target_device_class,
        cursor,
        handoff_status,
        expires_at,
        formal_runtime_allowed
    )
    VALUES
    (
        @handoff_id,
        @token_hash,
        @room_id,
        @session_id,
        @actor_member_id,
        @source_device_id,
        @target_device_class,
        @cursor,
        N'issued',
        @expires_at,
        0
    );

    COMMIT TRANSACTION;

    SELECT
        handoff_id,
        room_id,
        session_id,
        actor_member_id,
        target_device_class,
        cursor,
        expires_at,
        handoff_status,
        formal_runtime_allowed
    FROM wop.Device_Handoff
    WHERE handoff_id = @handoff_id;
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Consume_Device_Handoff
    @token_hash CHAR(64),
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @target_device_id NVARCHAR(128),
    @target_device_class NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF LEN(@token_hash) <> 64
        THROW 51220, 'token_hash must contain 64 characters', 1;
    IF NULLIF(LTRIM(RTRIM(@target_device_id)), N'') IS NULL
        THROW 51221, 'target_device_id is required', 1;

    DECLARE
        @handoff_id UNIQUEIDENTIFIER,
        @stored_room_id UNIQUEIDENTIFIER,
        @stored_session_id UNIQUEIDENTIFIER,
        @stored_device_class NVARCHAR(64),
        @status NVARCHAR(16),
        @expires_at DATETIME2(3);

    BEGIN TRANSACTION;

    SELECT
        @handoff_id = handoff_id,
        @stored_room_id = room_id,
        @stored_session_id = session_id,
        @stored_device_class = target_device_class,
        @status = handoff_status,
        @expires_at = expires_at
    FROM wop.Device_Handoff WITH (UPDLOCK, HOLDLOCK)
    WHERE token_hash = @token_hash;

    IF @handoff_id IS NULL
        THROW 51222, 'handoff token is invalid', 1;
    IF @status <> N'issued'
        THROW 51223, 'handoff token has already been consumed, revoked, or expired', 1;
    IF @expires_at <= SYSUTCDATETIME()
    BEGIN
        UPDATE wop.Device_Handoff
        SET handoff_status = N'expired'
        WHERE handoff_id = @handoff_id;
        COMMIT TRANSACTION;
        THROW 51224, 'handoff token has expired', 1;
    END;
    IF @stored_room_id <> @room_id OR @stored_session_id <> @session_id
        THROW 51225, 'handoff token does not match room and session', 1;
    IF @stored_device_class <> @target_device_class
        THROW 51226, 'target device class does not match the handoff', 1;

    UPDATE wop.Device_Handoff
    SET
        handoff_status = N'consumed',
        consumed_at = SYSUTCDATETIME(),
        consumed_device_id = @target_device_id
    WHERE handoff_id = @handoff_id;

    COMMIT TRANSACTION;

    SELECT
        handoff_id,
        room_id,
        session_id,
        actor_member_id,
        source_device_id,
        target_device_class,
        cursor,
        handoff_status,
        consumed_at,
        consumed_device_id,
        formal_runtime_allowed
    FROM wop.Device_Handoff
    WHERE handoff_id = @handoff_id;
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Record_Snapshot_Rebuild
    @rebuild_receipt_id UNIQUEIDENTIFIER,
    @room_id UNIQUEIDENTIFIER,
    @source_snapshot_id UNIQUEIDENTIFIER,
    @source_room_version BIGINT,
    @target_room_version BIGINT,
    @source_schema_version NVARCHAR(32),
    @target_schema_version NVARCHAR(32),
    @event_count BIGINT,
    @migration_path_json NVARCHAR(MAX),
    @result_state_hash CHAR(64) = NULL,
    @rebuild_status NVARCHAR(16),
    @error_code NVARCHAR(64) = NULL,
    @error_message NVARCHAR(1024) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @source_room_version < 0 OR @target_room_version < @source_room_version
        THROW 51240, 'invalid rebuild version range', 1;
    IF @event_count < 0
        THROW 51241, 'event_count must be non-negative', 1;
    IF ISJSON(@migration_path_json) <> 1
        THROW 51242, 'migration_path_json must be valid JSON', 1;
    IF @result_state_hash IS NOT NULL AND LEN(@result_state_hash) <> 64
        THROW 51243, 'result_state_hash must contain 64 characters', 1;

    INSERT INTO wop.Snapshot_Rebuild_Receipt
    (
        rebuild_receipt_id,
        room_id,
        source_snapshot_id,
        source_room_version,
        target_room_version,
        source_schema_version,
        target_schema_version,
        event_count,
        migration_path_json,
        result_state_hash,
        rebuild_status,
        error_code,
        error_message,
        formal_runtime_allowed
    )
    VALUES
    (
        @rebuild_receipt_id,
        @room_id,
        @source_snapshot_id,
        @source_room_version,
        @target_room_version,
        @source_schema_version,
        @target_schema_version,
        @event_count,
        @migration_path_json,
        @result_state_hash,
        @rebuild_status,
        @error_code,
        @error_message,
        0
    );
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Record_Reconnect_Plan
    @reconnect_receipt_id UNIQUEIDENTIFIER,
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @requested_cursor BIGINT,
    @authoritative_version BIGINT,
    @delivery_mode NVARCHAR(32),
    @snapshot_id UNIQUEIDENTIFIER = NULL,
    @delivered_from_version BIGINT,
    @delivered_to_version BIGINT,
    @event_count INT,
    @has_more BIT,
    @reconnect_status NVARCHAR(16) = N'planned',
    @error_code NVARCHAR(64) = NULL,
    @error_message NVARCHAR(1024) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO wop.Reconnect_Receipt
    (
        reconnect_receipt_id,
        room_id,
        session_id,
        requested_cursor,
        authoritative_version,
        delivery_mode,
        snapshot_id,
        delivered_from_version,
        delivered_to_version,
        event_count,
        has_more,
        reconnect_status,
        error_code,
        error_message,
        formal_runtime_allowed
    )
    VALUES
    (
        @reconnect_receipt_id,
        @room_id,
        @session_id,
        @requested_cursor,
        @authoritative_version,
        @delivery_mode,
        @snapshot_id,
        @delivered_from_version,
        @delivered_to_version,
        @event_count,
        @has_more,
        @reconnect_status,
        @error_code,
        @error_message,
        0
    );
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Acknowledge_Reconnect
    @reconnect_receipt_id UNIQUEIDENTIFIER,
    @acknowledged_cursor BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @requested_cursor BIGINT,
        @delivered_to_version BIGINT,
        @status NVARCHAR(16),
        @previous_ack BIGINT;

    BEGIN TRANSACTION;

    SELECT
        @requested_cursor = requested_cursor,
        @delivered_to_version = delivered_to_version,
        @status = reconnect_status,
        @previous_ack = acknowledged_cursor
    FROM wop.Reconnect_Receipt WITH (UPDLOCK, HOLDLOCK)
    WHERE reconnect_receipt_id = @reconnect_receipt_id;

    IF @status IS NULL
        THROW 51260, 'reconnect receipt does not exist', 1;
    IF @status = N'rejected'
        THROW 51261, 'rejected reconnect receipt cannot be acknowledged', 1;
    IF @acknowledged_cursor < @requested_cursor OR @acknowledged_cursor > @delivered_to_version
        THROW 51262, 'acknowledged cursor is outside the delivered range', 1;
    IF @previous_ack IS NOT NULL AND @acknowledged_cursor < @previous_ack
        THROW 51263, 'acknowledged cursor cannot move backwards', 1;

    UPDATE wop.Reconnect_Receipt
    SET
        acknowledged_cursor = @acknowledged_cursor,
        acknowledged_at = SYSUTCDATETIME(),
        reconnect_status = N'acknowledged'
    WHERE reconnect_receipt_id = @reconnect_receipt_id;

    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Record_Offline_Operation_Receipt
    @offline_receipt_id UNIQUEIDENTIFIER,
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @command_id UNIQUEIDENTIFIER,
    @idempotency_key NVARCHAR(128),
    @client_sequence BIGINT,
    @expected_version BIGINT,
    @operation_status NVARCHAR(16),
    @superseded_by_command_id UNIQUEIDENTIFIER = NULL,
    @body_hash CHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    INSERT INTO wop.Offline_Operation_Receipt
    (
        offline_receipt_id,
        room_id,
        session_id,
        command_id,
        idempotency_key,
        client_sequence,
        expected_version,
        operation_status,
        superseded_by_command_id,
        body_hash,
        formal_runtime_allowed
    )
    VALUES
    (
        @offline_receipt_id,
        @room_id,
        @session_id,
        @command_id,
        @idempotency_key,
        @client_sequence,
        @expected_version,
        @operation_status,
        @superseded_by_command_id,
        @body_hash,
        0
    );
END;
GO
