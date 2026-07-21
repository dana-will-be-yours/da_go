import assert from "node:assert/strict";
import { MemoryStorage, WorldOpsClientCache } from "../runtime/worldops_cache_adapter.js";
import { WorldOpsCapabilityRegistry } from "../runtime/worldops_capability_registry.js";
import { WorldOpsConfigLoader } from "../runtime/worldops_config_loader.js";
import { WorldOpsPermissionGate } from "../runtime/worldops_permission_gate.js";
import { WorldOpsRuntimeBridge } from "../runtime/worldops_runtime_bridge.js";
import { WorldOpsSessionHandshake } from "../runtime/worldops_session_handshake.js";
import { WorldOpsSnapshotManager } from "../runtime/worldops_snapshot_manager.js";
import { WorldOpsBootCoordinator } from "../runtime/worldops_boot_coordinator.js";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

async function rejectsCode(fn, code) {
  await assert.rejects(fn, error => error instanceof Error && error.code === code);
}

function createRegistry() {
  const registry = new WorldOpsCapabilityRegistry();
  registry.registerRole("player", ["room.enter", "room.read", "chat.send"]);
  registry.registerRole("gm", ["room.enter", "room.read", "chat.send", "room.manage", "snapshot.request"]);
  registry.seal();
  return registry;
}

function createPermissionGate() {
  return new WorldOpsPermissionGate({
    policies: [
      {
        id: "room.enter.allow",
        resource: "room.play",
        action: "enter",
        effect: "allow",
        allOf: ["room.enter"],
        priority: 10,
      },
      {
        id: "canon.write.deny",
        resource: "canon.*",
        action: "*",
        effect: "deny",
        priority: 100,
      },
    ],
  });
}

function createHandshake({ schemaVersion = "1", openCalls = [], closeCalls = [] } = {}) {
  return new WorldOpsSessionHandshake({
    transport: {
      open: async request => {
        openCalls.push(request);
        return {
          accepted: true,
          session_id: "SESSION-1",
          room_id: request.room_id,
          room_version: 7,
          schema_version: schemaVersion,
          snapshot_cursor: "CURSOR-7",
          server_time: "2026-07-21T00:00:00Z",
          capabilities: ["room.enter", "room.read", "chat.send", "room.manage", "snapshot.request"],
        };
      },
      close: async payload => closeCalls.push(payload),
    },
  });
}

function createSnapshotManager({ requestCalls = [], loadCalls = [] } = {}) {
  const cache = new WorldOpsClientCache({ namespace: "p02", storage: new MemoryStorage() });
  const adapter = {
    load: async request => {
      loadCalls.push(request);
      return {
        snapshot_id: "SNAPSHOT-7",
        room_id: request.room_id,
        room_version: 7,
        schema_version: request.schema_version,
        cursor: request.cursor,
        created_at: "2026-07-21T00:00:00Z",
        state: { scene_id: "SCENE-1", token_count: 0 },
        authoritative: true,
      };
    },
    requestSnapshot: async request => {
      requestCalls.push(request);
      return { accepted: true, request_id: `REQ-${requestCalls.length}` };
    },
  };
  return { manager: new WorldOpsSnapshotManager({ adapter, cache, schemaVersion: "1" }), cache };
}

test("config loader merges defaults, freezes safety flags, and blocks secret-like keys", async () => {
  const loader = new WorldOpsConfigLoader({
    defaults: {
      runtimeVersion: "0.2.0",
      schemaVersion: "1",
      autosnapshotIntervalMs: 30000,
      nested: { a: 1, b: 2 },
    },
  });
  const { config, receipt } = await loader.load({ nested: { b: 3 } }, { device: { mode: "mobile" } });
  assert.deepEqual(config.nested, { a: 1, b: 3 });
  assert.equal(config.device.mode, "mobile");
  assert.equal(config.formalRuntimeAllowed, false);
  assert.equal(config.clientCacheAuthoritative, false);
  assert.equal(config.canonAutoWrite, false);
  assert.equal(receipt.formal_runtime_allowed, false);
  await rejectsCode(
    () => loader.load({ runtimeVersion: "0.2.0", schemaVersion: "1", api_token: "forbidden" }),
    "SECRET_IN_CLIENT_CONFIG",
  );
});

test("capability registry blocks reserved client grants and resolves sealed roles", () => {
  const registry = createRegistry();
  assert.deepEqual(
    registry.resolve({ roles: ["player"], explicit: ["ui.mobile"] }),
    ["chat.send", "room.enter", "room.read", "ui.mobile"],
  );
  assert.throws(
    () => registry.resolve({ roles: ["player"], explicit: ["canon.write"] }),
    error => error.code === "RESERVED_CAPABILITY",
  );
  assert.throws(
    () => registry.registerRole("observer", ["room.read"]),
    error => error.code === "CAPABILITY_REGISTRY_SEALED",
  );
});

test("permission gate is default-deny and deny rules override allow rules", async () => {
  const gate = createPermissionGate();
  const allow = await gate.authorize({
    resource: "room.play",
    action: "enter",
    capabilities: ["room.enter"],
    subject: "SESSION-1",
  });
  assert.equal(allow.decision, "allow");
  await rejectsCode(
    () => gate.authorize({ resource: "room.play", action: "enter", capabilities: [], subject: "SESSION-1" }),
    "PERMISSION_DENIED",
  );
  await rejectsCode(
    () => gate.authorize({ resource: "canon.assertion", action: "write", capabilities: ["canon.write"] }),
    "PERMISSION_DENIED",
  );
});

test("session handshake validates room/schema and redacts credential from request hash", async () => {
  const openCalls = [];
  const closeCalls = [];
  const handshake = createHandshake({ openCalls, closeCalls });
  const result = await handshake.open({
    clientId: "CLIENT-1",
    roomId: "ROOM-1",
    runtimeVersion: "0.2.0",
    schemaVersion: "1",
    deviceMode: "mobile",
    credential: "secret-access-code",
  });
  assert.equal(result.session.session_id, "SESSION-1");
  assert.equal(result.session.formal_runtime_allowed, false);
  assert.ok(result.receipt.credential_hash);
  assert.equal(JSON.stringify(result.receipt).includes("secret-access-code"), false);
  assert.equal(openCalls[0].credential, "secret-access-code");
  const closed = await handshake.close({ reason: "test" });
  assert.equal(closed.status, "closed");
  assert.equal(closeCalls.length, 1);

  const mismatch = createHandshake({ schemaVersion: "2" });
  await rejectsCode(
    () => mismatch.open({ clientId: "CLIENT-1", roomId: "ROOM-1", runtimeVersion: "0.2.0", schemaVersion: "1" }),
    "HANDSHAKE_SCHEMA_MISMATCH",
  );
});

test("snapshot manager accepts authoritative server state but client only requests snapshots", async () => {
  const requestCalls = [];
  const loadCalls = [];
  const { manager, cache } = createSnapshotManager({ requestCalls, loadCalls });
  const hydrated = await manager.hydrate({ roomId: "ROOM-1", sessionId: "SESSION-1", cursor: "CURSOR-7" });
  assert.equal(hydrated.snapshot.authoritative, true);
  assert.equal(hydrated.receipt.cache_authoritative, false);
  assert.equal(manager.readLocal("ROOM-1").snapshot_id, "SNAPSHOT-7");
  assert.equal(cache.authoritative, false);
  const request = await manager.requestSnapshot({
    roomId: "ROOM-1",
    sessionId: "SESSION-1",
    expectedVersion: 7,
    reason: "manual",
    clientStateDigest: "digest",
  });
  assert.equal(request.authoritative_snapshot_written_by_client, false);
  assert.equal(requestCalls.length, 1);
  assert.equal(loadCalls.length, 1);
});

test("module lifecycle starts dependencies first, suspends dependents first, and resumes dependencies first", async () => {
  const runtime = new WorldOpsRuntimeBridge({ storage: new MemoryStorage() });
  const calls = [];
  runtime.modules.register({ id: "core", version: "1" }, {
    start: () => calls.push("start-core"),
    suspend: () => calls.push("suspend-core"),
    resume: () => calls.push("resume-core"),
    stop: () => calls.push("stop-core"),
  });
  runtime.modules.register({ id: "room", version: "1", dependencies: ["core"] }, {
    start: () => calls.push("start-room"),
    suspend: () => calls.push("suspend-room"),
    resume: () => calls.push("resume-room"),
    stop: () => calls.push("stop-room"),
  });
  await runtime.start({ capabilities: [] });
  await runtime.suspend({ reason: "test" });
  await runtime.resume({ reason: "test" });
  await runtime.stop({ reason: "test" });
  assert.deepEqual(calls, [
    "start-core",
    "start-room",
    "suspend-room",
    "suspend-core",
    "resume-core",
    "resume-room",
    "stop-room",
    "stop-core",
  ]);
  assert.equal(runtime.status().authoritative, false);
  assert.equal(runtime.status().formalRuntimeAllowed, false);
});

test("boot coordinator executes the complete session lifecycle and flushes receipts", async () => {
  const runtime = new WorldOpsRuntimeBridge({ storage: new MemoryStorage() });
  runtime.modules.register({ id: "core", version: "1" }, {});
  runtime.modules.register({ id: "room", version: "1", dependencies: ["core"] }, {});

  const configLoader = new WorldOpsConfigLoader({
    defaults: {
      runtimeVersion: "0.2.0",
      schemaVersion: "1",
      autosnapshotIntervalMs: 1000,
    },
  });
  const capabilityRegistry = createRegistry();
  const permissionGate = createPermissionGate();
  const openCalls = [];
  const closeCalls = [];
  const handshake = createHandshake({ openCalls, closeCalls });
  const requestCalls = [];
  const { manager: snapshotManager } = createSnapshotManager({ requestCalls });
  const intervals = [];
  const scheduler = {
    setInterval: (fn, delay) => {
      const row = { fn, delay, cleared: false };
      intervals.push(row);
      return row;
    },
    clearInterval: row => { row.cleared = true; },
  };
  const flushed = [];
  const coordinator = new WorldOpsBootCoordinator({
    runtime,
    configLoader,
    capabilityRegistry,
    permissionGate,
    handshake,
    snapshotManager,
    receiptSink: {
      flush: async payload => {
        flushed.push(payload);
        return { status: "accepted", record_count: 1 };
      },
    },
    scheduler,
  });

  const started = await coordinator.start({
    configSource: {},
    roles: ["gm"],
    roomId: "ROOM-1",
    clientId: "CLIENT-1",
    credential: "access-code",
    deviceMode: "mobile",
  });
  assert.equal(started.boot_status, "ready");
  assert.deepEqual(started.phases.map(row => row.phase), [
    "config",
    "client_capabilities",
    "session_handshake",
    "permission",
    "snapshot",
    "runtime",
  ]);
  assert.equal(coordinator.status().autosnapshot_active, true);
  assert.equal(intervals.length, 1);
  assert.equal(intervals[0].delay, 1000);
  await intervals[0].fn();
  assert.equal(requestCalls.length, 1);

  const suspended = await coordinator.suspend({ reason: "background" });
  assert.equal(suspended.boot_status, "suspended");
  assert.equal(intervals[0].cleared, true);
  assert.equal(requestCalls.length, 2);

  const resumed = await coordinator.resume({});
  assert.equal(resumed.boot_status, "ready");
  assert.equal(intervals.length, 2);

  const stopped = await coordinator.stop({ reason: "complete" });
  assert.equal(stopped.boot_status, "stopped");
  assert.equal(closeCalls.length, 1);
  assert.equal(flushed.length, 1);
  assert.equal(requestCalls.length, 3);
  assert.equal(coordinator.status().formal_runtime_allowed, false);
});

test("boot coordinator failure closes the handshake and leaves formal runtime disabled", async () => {
  const runtime = new WorldOpsRuntimeBridge({ storage: new MemoryStorage() });
  runtime.modules.register({ id: "core", version: "1" }, {});
  const configLoader = new WorldOpsConfigLoader({ defaults: { runtimeVersion: "0.2.0", schemaVersion: "1" } });
  const capabilityRegistry = new WorldOpsCapabilityRegistry();
  capabilityRegistry.registerRole("guest", []);
  capabilityRegistry.seal();
  const permissionGate = createPermissionGate();
  const closeCalls = [];
  const handshake = createHandshake({ closeCalls });
  const { manager: snapshotManager } = createSnapshotManager();
  const coordinator = new WorldOpsBootCoordinator({
    runtime,
    configLoader,
    capabilityRegistry,
    permissionGate,
    handshake,
    snapshotManager,
  });
  await rejectsCode(
    () => coordinator.start({ roles: ["guest"], roomId: "ROOM-1", clientId: "CLIENT-1" }),
    "BOOT_PIPELINE_FAILED",
  );
  assert.equal(coordinator.status().state, "failed");
  assert.equal(runtime.status().started, false);
  assert.equal(closeCalls.length, 1);
  assert.equal(coordinator.status().formal_runtime_allowed, false);
});

test("module hook timeout fails startup and records the timeout code", async () => {
  const runtime = new WorldOpsRuntimeBridge({ storage: new MemoryStorage() });
  runtime.modules.timeoutMs = 5;
  runtime.modules.register({ id: "slow", version: "1" }, {
    start: () => new Promise(resolve => setTimeout(resolve, 50)),
  });
  await rejectsCode(() => runtime.start({}), "RUNTIME_START_FAILED");
  assert.equal(runtime.modules.status().state, "failed");
  assert.equal(runtime.modules.lastReceipt.error.code, "MODULE_HOOK_TIMEOUT");
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
    break;
  }
}
console.log(`${passed}/${tests.length} P02 boot lifecycle tests passed`);
