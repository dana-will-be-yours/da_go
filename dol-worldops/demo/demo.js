import { MemoryStorage } from "../runtime/worldops_cache_adapter.js";
import { WorldOpsBootCoordinator } from "../runtime/worldops_boot_coordinator.js";
import { WorldOpsCapabilityRegistry } from "../runtime/worldops_capability_registry.js";
import { WorldOpsConfigLoader } from "../runtime/worldops_config_loader.js";
import { WorldOpsPermissionGate } from "../runtime/worldops_permission_gate.js";
import { WorldOpsRuntimeBridge } from "../runtime/worldops_runtime_bridge.js";
import { WorldOpsSessionHandshake } from "../runtime/worldops_session_handshake.js";
import { WorldOpsSnapshotManager } from "../runtime/worldops_snapshot_manager.js";

function browserStorage() {
  try {
    return globalThis.localStorage || new MemoryStorage();
  } catch {
    return new MemoryStorage();
  }
}

const runtime = new WorldOpsRuntimeBridge({
  namespace: "worldops-demo",
  schemaVersion: "1",
  storage: browserStorage(),
});

const capabilityRegistry = new WorldOpsCapabilityRegistry();
capabilityRegistry.registerRole("gm", ["room.enter", "room.manage", "room.message", "snapshot.request"]);
capabilityRegistry.seal();

const permissionGate = new WorldOpsPermissionGate({ policies: [{
  id: "room.enter.allow",
  resource: "room.play",
  action: "enter",
  effect: "allow",
  allOf: ["room.enter"],
  priority: 100,
}] });

const handshake = new WorldOpsSessionHandshake({
  transport: {
    open: async request => ({
      accepted: true,
      session_id: "DEMO-SESSION",
      room_id: request.room_id,
      room_version: 1,
      schema_version: request.schema_version,
      snapshot_cursor: "DEMO-CURSOR-1",
      server_time: new Date().toISOString(),
      capabilities: ["room.enter", "room.manage", "room.message", "snapshot.request"],
    }),
    close: async () => undefined,
  },
});

const snapshotManager = new WorldOpsSnapshotManager({
  cache: runtime.cache,
  schemaVersion: "1",
  adapter: {
    load: async request => ({
      snapshot_id: "DEMO-SNAPSHOT-1",
      room_id: request.room_id,
      room_version: 1,
      schema_version: request.schema_version,
      cursor: request.cursor,
      created_at: new Date().toISOString(),
      state: { scene: "runtime-foundation", messages: [] },
      authoritative: true,
    }),
    requestSnapshot: async () => ({ accepted: true, request_id: `DEMO-REQUEST-${Date.now()}` }),
  },
});

const coordinator = new WorldOpsBootCoordinator({
  runtime,
  configLoader: new WorldOpsConfigLoader(),
  capabilityRegistry,
  permissionGate,
  handshake,
  snapshotManager,
});

runtime.modules.register({ id: "worldops.core", version: "0.2.0" }, {
  start: async () => runtime.cache.set("boot", { started: true }),
  suspend: async () => runtime.cache.set("boot", { suspended: true }),
  resume: async () => runtime.cache.set("boot", { started: true }),
  stop: () => runtime.cache.remove("boot"),
});
runtime.modules.register({
  id: "worldops.room",
  version: "0.2.0",
  dependencies: ["worldops.core"],
}, {});

runtime.macros.register({
  id: "room.echo",
  version: "0.2.0",
  capabilities: ["room.message"],
}, ({ text }) => ({ text, echoed: true }));

runtime.widgets.register({
  id: "runtime.status",
  version: "0.2.0",
  deviceModes: ["desktop", "tablet", "mobile"],
}, ({ target, props }) => {
  const element = document.createElement("div");
  element.className = "demo-widget";
  element.textContent = props.text;
  target.replaceChildren(element);
  return () => target.replaceChildren();
});

const statusOutput = document.querySelector("#statusOutput");
const receiptOutput = document.querySelector("#receiptOutput");
const target = document.querySelector("#widgetTarget");
const buttons = {
  start: document.querySelector("#startButton"),
  suspend: document.querySelector("#suspendButton"),
  resume: document.querySelector("#resumeButton"),
  event: document.querySelector("#eventButton"),
  stop: document.querySelector("#stopButton"),
};
let mountId = null;

runtime.events.on("demo.message", async payload => {
  const result = await runtime.macros.invoke("room.echo", payload, { capabilities: ["room.message"] });
  receiptOutput.textContent = JSON.stringify(result, null, 2);
});

function deviceMode() {
  if (matchMedia("(max-width: 720px)").matches) return "mobile";
  if (matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

function render() {
  statusOutput.textContent = JSON.stringify(coordinator.status(), null, 2);
  const state = coordinator.status().state;
  buttons.start.disabled = !["idle", "stopped", "failed"].includes(state);
  buttons.suspend.disabled = state !== "ready";
  buttons.resume.disabled = state !== "suspended";
  buttons.event.disabled = state !== "ready";
  buttons.stop.disabled = ["idle", "stopped"].includes(state);
}

async function run(operation) {
  try {
    const receipt = await operation();
    receiptOutput.textContent = JSON.stringify(receipt, null, 2);
  } catch (error) {
    receiptOutput.textContent = JSON.stringify({
      name: error?.name,
      code: error?.code,
      message: error?.message,
      details: error?.details,
    }, null, 2);
  } finally {
    render();
  }
}

buttons.start.addEventListener("click", () => run(async () => {
  const mode = deviceMode();
  const receipt = await coordinator.start({
    configSource: new URL("../config/runtime.config.json", import.meta.url).href,
    roles: ["gm"],
    roomId: "DEMO-ROOM",
    clientId: "DEMO-CLIENT",
    credential: "synthetic-demo-code",
    deviceMode: mode,
  });
  const mount = await runtime.widgets.mount("runtime.status", target, { text: `Boot ready (${mode})` }, { deviceMode: mode });
  mountId = mount.mount_id;
  return receipt;
}));

buttons.suspend.addEventListener("click", () => run(() => coordinator.suspend({ reason: "demo-background" })));
buttons.resume.addEventListener("click", () => run(() => coordinator.resume({})));
buttons.event.addEventListener("click", () => run(async () => {
  await runtime.events.emit("demo.message", { text: "陽月：這是一筆合成測試訊息。" }, { capabilities: ["room.message"] });
  return runtime.events.exportReceipts().at(-1);
}));
buttons.stop.addEventListener("click", () => run(async () => {
  if (mountId) await runtime.widgets.unmount(mountId);
  mountId = null;
  return coordinator.stop({ reason: "demo-stop" });
}));

render();
