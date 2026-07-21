SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF SCHEMA_ID(N'wop') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA wop AUTHORIZATION dbo;');
END;
GO

IF OBJECT_ID(N'wop.Room', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Room
    (
        room_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Room PRIMARY KEY,
        room_code NVARCHAR(128) NOT NULL,
        schema_version NVARCHAR(32) NOT NULL,
        current_version BIGINT NOT NULL
            CONSTRAINT DF_wop_Room_current_version DEFAULT (0),
        state_json NVARCHAR(MAX) NOT NULL
            CONSTRAINT DF_wop_Room_state_json DEFAULT (N'{}'),
        state_hash CHAR(64) NOT NULL,
        room_status NVARCHAR(24) NOT NULL
            CONSTRAINT DF_wop_Room_room_status DEFAULT (N'open'),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_updated_at DEFAULT (SYSUTCDATETIME()),
        row_version ROWVERSION NOT NULL,
        CONSTRAINT UQ_wop_Room_room_code UNIQUE (room_code),
        CONSTRAINT CK_wop_Room_current_version CHECK (current_version >= 0),
        CONSTRAINT CK_wop_Room_state_json CHECK (ISJSON(state_json) = 1),
        CONSTRAINT CK_wop_Room_state_hash CHECK (LEN(state_hash) = 64),
        CONSTRAINT CK_wop_Room_status CHECK (room_status IN (N'open', N'paused', N'frozen', N'closed'))
    );
END;
GO

IF OBJECT_ID(N'wop.Command_Type', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Command_Type
    (
        command_type NVARCHAR(128) NOT NULL
            CONSTRAINT PK_wop_Command_Type PRIMARY KEY,
        required_capability NVARCHAR(128) NOT NULL,
        event_type NVARCHAR(128) NOT NULL,
        is_active BIT NOT NULL
            CONSTRAINT DF_wop_Command_Type_is_active DEFAULT (1),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Command_Type_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF OBJECT_ID(N'wop.Client_Session', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Client_Session
    (
        session_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Client_Session PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        actor_member_id NVARCHAR(128) NOT NULL,
        capabilities_json NVARCHAR(MAX) NOT NULL,
        session_status NVARCHAR(16) NOT NULL
            CONSTRAINT DF_wop_Client_Session_status DEFAULT (N'active'),
        expires_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Client_Session_created_at DEFAULT (SYSUTCDATETIME()),
        revoked_at DATETIME2(3) NULL,
        row_version ROWVERSION NOT NULL,
        CONSTRAINT FK_wop_Client_Session_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT CK_wop_Client_Session_capabilities_json CHECK (ISJSON(capabilities_json) = 1),
        CONSTRAINT CK_wop_Client_Session_status CHECK (session_status IN (N'active', N'revoked', N'expired'))
    );
END;
GO

IF OBJECT_ID(N'wop.Room_Command', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Room_Command
    (
        command_row_id BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_wop_Room_Command PRIMARY KEY,
        command_id UNIQUEIDENTIFIER NOT NULL,
        idempotency_key NVARCHAR(128) NOT NULL,
        room_id UNIQUEIDENTIFIER NOT NULL,
        session_id UNIQUEIDENTIFIER NOT NULL,
        actor_member_id NVARCHAR(128) NOT NULL,
        command_type NVARCHAR(128) NOT NULL,
        expected_version BIGINT NOT NULL,
        payload_json NVARCHAR(MAX) NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        fingerprint CHAR(64) NOT NULL,
        command_status NVARCHAR(16) NOT NULL,
        result_version BIGINT NOT NULL,
        error_code NVARCHAR(64) NULL,
        error_message NVARCHAR(1024) NULL,
        received_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_Command_received_at DEFAULT (SYSUTCDATETIME()),
        completed_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_Command_completed_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_wop_Room_Command_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Room_Command_Session
            FOREIGN KEY (session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT FK_wop_Room_Command_Type
            FOREIGN KEY (command_type) REFERENCES wop.Command_Type(command_type),
        CONSTRAINT UQ_wop_Room_Command_command UNIQUE (room_id, command_id),
        CONSTRAINT UQ_wop_Room_Command_idempotency UNIQUE (room_id, idempotency_key),
        CONSTRAINT CK_wop_Room_Command_expected_version CHECK (expected_version >= 0),
        CONSTRAINT CK_wop_Room_Command_payload_json CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT CK_wop_Room_Command_payload_hash CHECK (LEN(payload_hash) = 64),
        CONSTRAINT CK_wop_Room_Command_fingerprint CHECK (LEN(fingerprint) = 64),
        CONSTRAINT CK_wop_Room_Command_status CHECK (command_status IN (N'accepted', N'conflict', N'rejected')),
        CONSTRAINT CK_wop_Room_Command_result_version CHECK (result_version >= 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Room_Event', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Room_Event
    (
        event_row_id BIGINT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_wop_Room_Event PRIMARY KEY,
        event_id UNIQUEIDENTIFIER NOT NULL,
        room_id UNIQUEIDENTIFIER NOT NULL,
        room_version BIGINT NOT NULL,
        command_id UNIQUEIDENTIFIER NOT NULL,
        event_type NVARCHAR(128) NOT NULL,
        payload_json NVARCHAR(MAX) NOT NULL,
        payload_hash CHAR(64) NOT NULL,
        occurred_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_Event_occurred_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_wop_Room_Event_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT UQ_wop_Room_Event_event UNIQUE (event_id),
        CONSTRAINT UQ_wop_Room_Event_version UNIQUE (room_id, room_version),
        CONSTRAINT UQ_wop_Room_Event_command UNIQUE (room_id, command_id),
        CONSTRAINT CK_wop_Room_Event_version CHECK (room_version >= 1),
        CONSTRAINT CK_wop_Room_Event_payload_json CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT CK_wop_Room_Event_payload_hash CHECK (LEN(payload_hash) = 64)
    );
END;
GO

IF OBJECT_ID(N'wop.Room_Snapshot', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Room_Snapshot
    (
        snapshot_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Room_Snapshot PRIMARY KEY,
        room_id UNIQUEIDENTIFIER NOT NULL,
        room_version BIGINT NOT NULL,
        schema_version NVARCHAR(32) NOT NULL,
        state_json NVARCHAR(MAX) NOT NULL,
        state_hash CHAR(64) NOT NULL,
        authoritative BIT NOT NULL
            CONSTRAINT DF_wop_Room_Snapshot_authoritative DEFAULT (1),
        created_by_session_id UNIQUEIDENTIFIER NULL,
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Room_Snapshot_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_wop_Room_Snapshot_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT FK_wop_Room_Snapshot_Session
            FOREIGN KEY (created_by_session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT UQ_wop_Room_Snapshot_version UNIQUE (room_id, room_version),
        CONSTRAINT CK_wop_Room_Snapshot_version CHECK (room_version >= 0),
        CONSTRAINT CK_wop_Room_Snapshot_state_json CHECK (ISJSON(state_json) = 1),
        CONSTRAINT CK_wop_Room_Snapshot_state_hash CHECK (LEN(state_hash) = 64),
        CONSTRAINT CK_wop_Room_Snapshot_authoritative CHECK (authoritative = 1)
    );
END;
GO

IF OBJECT_ID(N'wop.Sync_Cursor', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Sync_Cursor
    (
        session_id UNIQUEIDENTIFIER NOT NULL,
        room_id UNIQUEIDENTIFIER NOT NULL,
        last_version BIGINT NOT NULL
            CONSTRAINT DF_wop_Sync_Cursor_last_version DEFAULT (0),
        updated_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Sync_Cursor_updated_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_wop_Sync_Cursor PRIMARY KEY (session_id, room_id),
        CONSTRAINT FK_wop_Sync_Cursor_Session
            FOREIGN KEY (session_id) REFERENCES wop.Client_Session(session_id),
        CONSTRAINT FK_wop_Sync_Cursor_Room
            FOREIGN KEY (room_id) REFERENCES wop.Room(room_id),
        CONSTRAINT CK_wop_Sync_Cursor_version CHECK (last_version >= 0)
    );
END;
GO

IF OBJECT_ID(N'wop.Operation_Receipt', N'U') IS NULL
BEGIN
    CREATE TABLE wop.Operation_Receipt
    (
        receipt_id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_wop_Operation_Receipt PRIMARY KEY,
        receipt_category NVARCHAR(64) NOT NULL,
        receipt_source NVARCHAR(128) NOT NULL,
        room_id UNIQUEIDENTIFIER NULL,
        session_id UNIQUEIDENTIFIER NULL,
        command_id UNIQUEIDENTIFIER NULL,
        receipt_status NVARCHAR(32) NOT NULL,
        body_json NVARCHAR(MAX) NOT NULL,
        body_hash CHAR(64) NOT NULL,
        formal_runtime_allowed BIT NOT NULL
            CONSTRAINT DF_wop_Operation_Receipt_formal_runtime DEFAULT (0),
        created_at DATETIME2(3) NOT NULL
            CONSTRAINT DF_wop_Operation_Receipt_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_wop_Operation_Receipt_body_json CHECK (ISJSON(body_json) = 1),
        CONSTRAINT CK_wop_Operation_Receipt_body_hash CHECK (LEN(body_hash) = 64),
        CONSTRAINT CK_wop_Operation_Receipt_formal_runtime CHECK (formal_runtime_allowed = 0)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'wop.Room_Event') AND name = N'IX_wop_Room_Event_room_cursor')
BEGIN
    CREATE INDEX IX_wop_Room_Event_room_cursor
        ON wop.Room_Event(room_id, room_version)
        INCLUDE (event_id, command_id, event_type, occurred_at);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'wop.Room_Command') AND name = N'IX_wop_Room_Command_session_received')
BEGIN
    CREATE INDEX IX_wop_Room_Command_session_received
        ON wop.Room_Command(session_id, received_at DESC)
        INCLUDE (room_id, command_id, command_type, command_status, result_version);
END;
GO

IF NOT EXISTS (SELECT 1 FROM wop.Command_Type WHERE command_type = N'room.message.append')
BEGIN
    INSERT INTO wop.Command_Type(command_type, required_capability, event_type)
    VALUES (N'room.message.append', N'chat.send', N'room.message.appended');
END;
IF NOT EXISTS (SELECT 1 FROM wop.Command_Type WHERE command_type = N'room.token.move')
BEGIN
    INSERT INTO wop.Command_Type(command_type, required_capability, event_type)
    VALUES (N'room.token.move', N'map.token.move', N'room.token.moved');
END;
IF NOT EXISTS (SELECT 1 FROM wop.Command_Type WHERE command_type = N'room.scene.activate')
BEGIN
    INSERT INTO wop.Command_Type(command_type, required_capability, event_type)
    VALUES (N'room.scene.activate', N'room.manage', N'room.scene.activated');
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Append_Room_Command_Event
    @command_id UNIQUEIDENTIFIER,
    @idempotency_key NVARCHAR(128),
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @actor_member_id NVARCHAR(128),
    @command_type NVARCHAR(128),
    @expected_version BIGINT,
    @payload_json NVARCHAR(MAX),
    @payload_hash CHAR(64),
    @fingerprint CHAR(64),
    @event_id UNIQUEIDENTIFIER,
    @event_type NVARCHAR(128),
    @event_payload_json NVARCHAR(MAX),
    @event_payload_hash CHAR(64),
    @next_state_json NVARCHAR(MAX),
    @next_state_hash CHAR(64),
    @result_status NVARCHAR(16) OUTPUT,
    @result_version BIGINT OUTPUT,
    @error_code NVARCHAR(64) OUTPUT,
    @receipt_id UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @expected_version < 0
        THROW 51001, 'expected_version must be non-negative', 1;
    IF ISJSON(@payload_json) <> 1
        THROW 51002, 'payload_json must be valid JSON', 1;
    IF ISJSON(@event_payload_json) <> 1
        THROW 51003, 'event_payload_json must be valid JSON', 1;
    IF ISJSON(@next_state_json) <> 1
        THROW 51004, 'next_state_json must be valid JSON', 1;
    IF LEN(@payload_hash) <> 64 OR LEN(@fingerprint) <> 64 OR LEN(@event_payload_hash) <> 64 OR LEN(@next_state_hash) <> 64
        THROW 51005, 'all supplied hashes must contain 64 characters', 1;

    DECLARE
        @current_version BIGINT,
        @session_room_id UNIQUEIDENTIFIER,
        @session_actor_member_id NVARCHAR(128),
        @session_status NVARCHAR(16),
        @session_expires_at DATETIME2(3),
        @capabilities_json NVARCHAR(MAX),
        @required_capability NVARCHAR(128),
        @registered_event_type NVARCHAR(128),
        @existing_fingerprint CHAR(64),
        @existing_status NVARCHAR(16),
        @existing_version BIGINT,
        @existing_error_code NVARCHAR(64),
        @receipt_body_json NVARCHAR(MAX),
        @receipt_body_hash CHAR(64);

    SET @result_status = N'rejected';
    SET @result_version = 0;
    SET @error_code = NULL;
    SET @receipt_id = NEWID();

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @current_version = current_version
        FROM wop.Room WITH (UPDLOCK, HOLDLOCK)
        WHERE room_id = @room_id;

        IF @current_version IS NULL
        BEGIN
            SET @error_code = N'ROOM_NOT_FOUND';
            COMMIT TRANSACTION;
            RETURN;
        END;

        SELECT
            @session_room_id = room_id,
            @session_actor_member_id = actor_member_id,
            @session_status = session_status,
            @session_expires_at = expires_at,
            @capabilities_json = capabilities_json
        FROM wop.Client_Session WITH (UPDLOCK, HOLDLOCK)
        WHERE session_id = @session_id;

        IF @session_room_id IS NULL OR @session_status <> N'active' OR (@session_expires_at IS NOT NULL AND @session_expires_at <= SYSUTCDATETIME())
        BEGIN
            SET @error_code = N'SESSION_INVALID';
            SET @result_version = @current_version;
            COMMIT TRANSACTION;
            RETURN;
        END;
        IF @session_room_id <> @room_id
        BEGIN
            SET @error_code = N'SESSION_ROOM_MISMATCH';
            SET @result_version = @current_version;
            COMMIT TRANSACTION;
            RETURN;
        END;
        IF @session_actor_member_id <> @actor_member_id
        BEGIN
            SET @error_code = N'SESSION_ACTOR_MISMATCH';
            SET @result_version = @current_version;
            COMMIT TRANSACTION;
            RETURN;
        END;

        SELECT
            @required_capability = required_capability,
            @registered_event_type = event_type
        FROM wop.Command_Type WITH (HOLDLOCK)
        WHERE command_type = @command_type AND is_active = 1;

        IF @required_capability IS NULL
        BEGIN
            SET @error_code = N'UNKNOWN_COMMAND_TYPE';
            SET @result_version = @current_version;
            COMMIT TRANSACTION;
            RETURN;
        END;
        IF @registered_event_type <> @event_type
            THROW 51006, 'event_type does not match the command registry', 1;
        IF NOT EXISTS
        (
            SELECT 1
            FROM OPENJSON(@capabilities_json)
            WHERE [type] = 1 AND CONVERT(NVARCHAR(128), [value]) = @required_capability
        )
        BEGIN
            SET @error_code = N'CAPABILITY_DENIED';
            SET @result_version = @current_version;
            COMMIT TRANSACTION;
            RETURN;
        END;

        SELECT TOP (1)
            @existing_fingerprint = fingerprint,
            @existing_status = command_status,
            @existing_version = result_version,
            @existing_error_code = error_code
        FROM wop.Room_Command WITH (UPDLOCK, HOLDLOCK)
        WHERE room_id = @room_id
          AND (command_id = @command_id OR idempotency_key = @idempotency_key)
        ORDER BY CASE WHEN command_id = @command_id THEN 0 ELSE 1 END;

        IF @existing_fingerprint IS NOT NULL
        BEGIN
            IF @existing_fingerprint = @fingerprint
            BEGIN
                SET @result_status = CASE WHEN @existing_status = N'accepted' THEN N'duplicate' ELSE @existing_status END;
                SET @result_version = @existing_version;
                SET @error_code = @existing_error_code;
            END;
            ELSE
            BEGIN
                SET @result_status = N'rejected';
                SET @result_version = @current_version;
                SET @error_code = N'IDEMPOTENCY_OR_COMMAND_ID_REUSED';
            END;
            COMMIT TRANSACTION;
            RETURN;
        END;

        IF @expected_version <> @current_version
        BEGIN
            SET @result_status = N'conflict';
            SET @result_version = @current_version;
            SET @error_code = N'VERSION_CONFLICT';

            INSERT INTO wop.Room_Command
            (
                command_id, idempotency_key, room_id, session_id, actor_member_id, command_type,
                expected_version, payload_json, payload_hash, fingerprint, command_status,
                result_version, error_code, error_message
            )
            VALUES
            (
                @command_id, @idempotency_key, @room_id, @session_id, @actor_member_id, @command_type,
                @expected_version, @payload_json, @payload_hash, @fingerprint, N'conflict',
                @current_version, N'VERSION_CONFLICT', N'expected_version does not match current_version'
            );

            SET @receipt_body_json =
            (
                SELECT @expected_version AS expected_version, @current_version AS current_version
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            );
            SET @receipt_body_hash = LOWER(CONVERT(CHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @receipt_body_json)), 2));
            INSERT INTO wop.Operation_Receipt
            (
                receipt_id, receipt_category, receipt_source, room_id, session_id, command_id,
                receipt_status, body_json, body_hash
            )
            VALUES
            (
                @receipt_id, N'command', N'wop.usp_Append_Room_Command_Event', @room_id, @session_id, @command_id,
                N'conflict', @receipt_body_json, @receipt_body_hash
            );

            COMMIT TRANSACTION;
            RETURN;
        END;

        SET @result_status = N'accepted';
        SET @result_version = @current_version + 1;
        SET @error_code = NULL;

        INSERT INTO wop.Room_Command
        (
            command_id, idempotency_key, room_id, session_id, actor_member_id, command_type,
            expected_version, payload_json, payload_hash, fingerprint, command_status,
            result_version
        )
        VALUES
        (
            @command_id, @idempotency_key, @room_id, @session_id, @actor_member_id, @command_type,
            @expected_version, @payload_json, @payload_hash, @fingerprint, N'accepted',
            @result_version
        );

        INSERT INTO wop.Room_Event
        (
            event_id, room_id, room_version, command_id, event_type, payload_json, payload_hash
        )
        VALUES
        (
            @event_id, @room_id, @result_version, @command_id, @event_type, @event_payload_json, @event_payload_hash
        );

        UPDATE wop.Room
        SET current_version = @result_version,
            state_json = @next_state_json,
            state_hash = @next_state_hash,
            updated_at = SYSUTCDATETIME()
        WHERE room_id = @room_id;

        SET @receipt_body_json =
        (
            SELECT @event_id AS event_id, @result_version AS room_version, @event_payload_hash AS payload_hash
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );
        SET @receipt_body_hash = LOWER(CONVERT(CHAR(64), HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @receipt_body_json)), 2));
        INSERT INTO wop.Operation_Receipt
        (
            receipt_id, receipt_category, receipt_source, room_id, session_id, command_id,
            receipt_status, body_json, body_hash
        )
        VALUES
        (
            @receipt_id, N'command', N'wop.usp_Append_Room_Command_Event', @room_id, @session_id, @command_id,
            N'accepted', @receipt_body_json, @receipt_body_hash
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Create_Room_Snapshot
    @snapshot_id UNIQUEIDENTIFIER,
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @expected_version BIGINT,
    @schema_version NVARCHAR(32),
    @state_json NVARCHAR(MAX),
    @state_hash CHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@state_json) <> 1
        THROW 51020, 'state_json must be valid JSON', 1;
    IF LEN(@state_hash) <> 64
        THROW 51021, 'state_hash must contain 64 characters', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @current_version BIGINT;
        SELECT @current_version = current_version
        FROM wop.Room WITH (UPDLOCK, HOLDLOCK)
        WHERE room_id = @room_id;

        IF @current_version IS NULL
            THROW 51022, 'room does not exist', 1;
        IF @current_version <> @expected_version
            THROW 51023, 'snapshot expected_version does not match current_version', 1;
        IF NOT EXISTS
        (
            SELECT 1
            FROM wop.Client_Session AS s
            CROSS APPLY OPENJSON(s.capabilities_json) AS c
            WHERE s.session_id = @session_id
              AND s.room_id = @room_id
              AND s.session_status = N'active'
              AND (s.expires_at IS NULL OR s.expires_at > SYSUTCDATETIME())
              AND c.[type] = 1
              AND CONVERT(NVARCHAR(128), c.[value]) = N'snapshot.request'
        )
            THROW 51024, 'session is not authorized to request a snapshot', 1;

        IF NOT EXISTS
        (
            SELECT 1 FROM wop.Room_Snapshot
            WHERE room_id = @room_id AND room_version = @current_version
        )
        BEGIN
            INSERT INTO wop.Room_Snapshot
            (
                snapshot_id, room_id, room_version, schema_version,
                state_json, state_hash, authoritative, created_by_session_id
            )
            VALUES
            (
                @snapshot_id, @room_id, @current_version, @schema_version,
                @state_json, @state_hash, 1, @session_id
            );
        END;

        SELECT TOP (1)
            snapshot_id, room_id, room_version, schema_version,
            state_json, state_hash, authoritative, created_by_session_id, created_at
        FROM wop.Room_Snapshot
        WHERE room_id = @room_id AND room_version = @current_version;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE wop.usp_Read_Room_Events
    @room_id UNIQUEIDENTIFIER,
    @session_id UNIQUEIDENTIFIER,
    @after_version BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @after_version < 0
        THROW 51030, 'after_version must be non-negative', 1;
    IF NOT EXISTS
    (
        SELECT 1
        FROM wop.Client_Session AS s
        CROSS APPLY OPENJSON(s.capabilities_json) AS c
        WHERE s.session_id = @session_id
          AND s.room_id = @room_id
          AND s.session_status = N'active'
          AND (s.expires_at IS NULL OR s.expires_at > SYSUTCDATETIME())
          AND c.[type] = 1
          AND CONVERT(NVARCHAR(128), c.[value]) = N'room.read'
    )
        THROW 51031, 'session is not authorized to read room events', 1;

    SELECT event_id, room_id, room_version, command_id, event_type, payload_json, payload_hash, occurred_at
    FROM wop.Room_Event
    WHERE room_id = @room_id AND room_version > @after_version
    ORDER BY room_version;

    DECLARE @current_version BIGINT = (SELECT current_version FROM wop.Room WHERE room_id = @room_id);
    IF @current_version IS NULL
        THROW 51032, 'room does not exist', 1;

    UPDATE wop.Sync_Cursor WITH (UPDLOCK, SERIALIZABLE)
    SET last_version = CASE WHEN last_version < @current_version THEN @current_version ELSE last_version END,
        updated_at = SYSUTCDATETIME()
    WHERE session_id = @session_id AND room_id = @room_id;

    IF @@ROWCOUNT = 0
    BEGIN
        INSERT INTO wop.Sync_Cursor(session_id, room_id, last_version)
        VALUES (@session_id, @room_id, @current_version);
    END;

    SELECT @current_version AS current_version, @current_version AS next_cursor;
END;
GO
