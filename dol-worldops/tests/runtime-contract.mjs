import assert from "node:assert/strict";
import { WorldOpsEventBus } from "../runtime/worldops_event_bus.js";
import { WorldOpsMacroRegistry } from "../runtime/worldops_macro_registry.js";
import { WorldOpsWidgetRegistry } from "../runtime/worldops_widget_registry.js";
import { MemoryStorage, WorldOpsClientCache } from "../runtime/worldops_cache_adapter.js";
import { WorldOpsReceiptStore } from "../runtime/worldops_receipt_store.js";
import { WorldOpsModuleLoader } from "../runtime/worldops_module_loader.js";
import { WorldOpsRuntimeBridge } from "../runtime/worldops_runtime_bridge.js";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

async function rejectsCode(fn, code) {
  await assert.rejects(fn, error => error instanceof Error && error.code === code);
}

test("event bus preserves priority, once semantics, capability gates, and error isolation", async () => {
  const bus = new WorldOpsEventBus({ maxReceipts: 2 });
  const order = [];
  bus.on("room.message", () => { order.push("low"); return "low"; }, { priority: 1 });
  bus.on("room.message", () => { order.push("high"); throw new Error("isolated"); }, { priority: 10, once: true });
  bus.on("room.message", () => { order.push("secret"); }, { capability: "gm.secret" });
  const first = await bus.emit("room.message", { text: "hello" }, { capabilities: [] });
  assert.deepEqual(order, ["high", "low"]);
  assert.equal(first.outcomes.filter(row => row.status === "rejected").length, 1);
  assert.equal(first.outcomes.filter(row => row.status === "skipped_capability").length, 1);
  order.length = 0;
  await bus.emit("room.message", { text: "again" }, { capabilities: ["gm.secret"] });
  assert.deepEqual(order, ["low", "secret"]);
  await bus.emit("room.message", { text: "third" }, { capabilities: [] });
  assert.equal(bus.exportReceipts().length, 2);
});

test("macro registry enforces stable ids, capabilities, duplicate rejection, and failure receipts", async () => {
  const macros = new WorldOpsMacroRegistry({ maxReceipts: 5 });
  macros.register({ id: "dice.roll", version: "1.0.0", capabilities: ["dice.use"] }, ({ sides }) => ({ result: sides }));
  await rejectsCode(() => macros.invoke("dice.roll", { sides: 20 }, { capabilities: [] }), "MACRO_CAPABILITY_DENIED");
  const result = await macros.invoke("dice.roll", { sides: 20 }, { capabilities: ["dice.use"] });
  assert.deepEqual(result.output, { result: 20 });
  assert.equal(result.receipt.status, "fulfilled");
  assert.throws(() => macros.register({ id: "dice.roll", version: "1.0.1" }, () => null), error => error.code === "DUPLICATE_MACRO");
  macros.register({ id: "test.fail", version: "1.0.0" }, () => { throw new Error("boom"); });
  await assert.rejects(() => macros.invoke("test.fail", {}, {}), /boom/);
  assert.equal(macros.exportReceipts().at(-1).status, "rejected");
});

test("widget registry supports all device modes and deterministic cleanup", async () => {
  const widgets = new WorldOpsWidgetRegistry();
  const cleaned = [];
  widgets.register({ id: "room.chat", version: "1.0.0", deviceModes: ["desktop", "tablet", "mobile"] }, ({ props }) => () => cleaned.push(props.instance));
  const mount = await widgets.mount("room.chat", {}, { instance: "mobile" }, { deviceMode: "mobile" });
  assert.equal(mount.status, "mounted");
  assert.equal(await widgets.unmount(mount.mount_id), true);
  assert.deepEqual(cleaned, ["mobile"]);
  widgets.register({ id: "desktop.only", version: "1.0.0", deviceModes: ["desktop"] }, () => null);
  await rejectsCode(() => widgets.mount("desktop.only", {}, {}, { deviceMode: "mobile" }), "WIDGET_DEVICE_DENIED");
});

test("widget cleanup failures are recorded while unmountAll continues in reverse order", async () => {
  const widgets = new WorldOpsWidgetRegistry();
  const calls = [];
  widgets.register({ id: "cleanup.one", version: "1.0.0", deviceModes: ["desktop"] }, () => () => {
    calls.push("one");
    throw new Error("cleanup one failed");
  });
  widgets.register({ id: "cleanup.two", version: "1.0.0", deviceModes: ["desktop"] }, () => () => {
    calls.push("two");
  });
  await widgets.mount("cleanup.one", {}, {}, { deviceMode: "desktop" });
  await widgets.mount("cleanup.two", {}, {}, { deviceMode: "desktop" });
  await rejectsCode(() => widgets.unmountAll(), "WIDGET_UNMOUNT_FAILED");
  assert.deepEqual(calls, ["two", "one"]);
  assert.equal(widgets.exportReceipts().some(row => row.status === "unmount_failed"), true);
});

test("client cache remains non-authoritative and recovers from ttl, schema, and corruption", async () => {
  const storage = new MemoryStorage();
  let ms = 1000;
  const cache = new WorldOpsClientCache({
    namespace: "test",
    schemaVersion: "1",
    storage,
    nowMs: () => ms,
    nowIso: () => `t${ms}`,
  });
  await cache.set("room", { version: 1 }, { ttlMs: 50 });
  assert.deepEqual(cache.get("room"), { version: 1 });
  ms = 1050;
  assert.equal(cache.get("room", "expired"), "expired");
  storage.setItem("test:bad", "not-json");
  assert.equal(cache.get("bad", "fallback"), "fallback");
  storage.setItem("test:wrong-schema", JSON.stringify({ schema_version: "0", authoritative: false, expires_at_ms: null, value: 9 }));
  assert.equal(cache.get("wrong-schema", 0), 0);
  await cache.set("one", 1);
  await cache.set("two", 2);
  storage.setItem("other:keep", "x");
  assert.equal(cache.clear(), 2);
  assert.equal(storage.getItem("other:keep"), "x");
  assert.equal(cache.authoritative, false);
});

test("receipt store bounds records and supports filtered export", async () => {
  const store = new WorldOpsReceiptStore({ maxReceipts: 2 });
  await store.append({ n: 1 }, { category: "a", source: "x" });
  await store.append({ n: 2 }, { category: "b", source: "x" });
  await store.append({ n: 3 }, { category: "a", source: "y" });
  assert.equal(store.export().length, 2);
  assert.equal(store.query({ category: "a" }).length, 1);
  assert.equal(store.export()[0].authoritative, false);
});

test("module loader resolves dependencies and stops in reverse order", async () => {
  const calls = [];
  const loader = new WorldOpsModuleLoader();
  loader.register({ id: "core", version: "1", dependencies: [] }, {
    start: () => calls.push("start-core"),
    stop: () => calls.push("stop-core"),
  });
  loader.register({ id: "room", version: "1", dependencies: ["core"] }, {
    start: () => calls.push("start-room"),
    stop: () => calls.push("stop-room"),
  });
  const started = await loader.start({});
  assert.deepEqual(started.order, ["core", "room"]);
  await loader.stop({});
  assert.deepEqual(calls, ["start-core", "start-room", "stop-room", "stop-core"]);
});

test("module loader rejects missing dependencies and cycles", async () => {
  const missing = new WorldOpsModuleLoader();
  missing.register({ id: "room", version: "1", dependencies: ["core"] });
  assert.throws(() => missing.resolveOrder(), error => error.code === "MISSING_MODULE_DEPENDENCY");
  const cycle = new WorldOpsModuleLoader();
  cycle.register({ id: "a", version: "1", dependencies: ["b"] });
  cycle.register({ id: "b", version: "1", dependencies: ["a"] });
  assert.throws(() => cycle.resolveOrder(), error => error.code === "MODULE_DEPENDENCY_CYCLE");
});

test("module start failure rolls back previously started modules", async () => {
  const calls = [];
  const loader = new WorldOpsModuleLoader();
  loader.register({ id: "a", version: "1" }, {
    start: () => calls.push("start-a"),
    rollback: () => calls.push("rollback-a"),
  });
  loader.register({ id: "b", version: "1", dependencies: ["a"] }, {
    start: () => { calls.push("start-b"); throw new Error("b failed"); },
  });
  await rejectsCode(() => loader.start({}), "RUNTIME_START_FAILED");
  assert.deepEqual(calls, ["start-a", "start-b", "rollback-a"]);
  assert.equal(loader.status().state, "failed");
  assert.equal(loader.lastReceipt.rollback[0].module_id, "a");
});

test("runtime bridge starts and stops a clean-room module graph", async () => {
  const runtime = new WorldOpsRuntimeBridge({ storage: new MemoryStorage() });
  runtime.modules.register({ id: "core", version: "1" }, {});
  runtime.modules.register({ id: "room", version: "1", dependencies: ["core"] }, {});
  const start = await runtime.start({ capabilities: [] });
  assert.equal(start.runtime_status, "ready");
  assert.equal(runtime.status().started, true);
  const stop = await runtime.stop({});
  assert.equal(stop.runtime_status, "stopped");
  assert.equal(runtime.status().started, false);
  assert.equal(runtime.status().authoritative, false);
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
console.log(`${passed}/${tests.length} runtime contract tests passed`);
