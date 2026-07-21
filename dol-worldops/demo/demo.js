import { MemoryStorage } from "../runtime/worldops_cache_adapter.js";
import { WorldOpsRuntimeBridge } from "../runtime/worldops_runtime_bridge.js";

const runtime = new WorldOpsRuntimeBridge({
  namespace: "worldops-demo",
  storage: globalThis.localStorage || new MemoryStorage(),
});
const statusOutput = document.querySelector("#statusOutput");
const receiptOutput = document.querySelector("#receiptOutput");
const target = document.querySelector("#widgetTarget");
const startButton = document.querySelector("#startButton");
const eventButton = document.querySelector("#eventButton");
const stopButton = document.querySelector("#stopButton");
let mountId = null;

runtime.modules.register({ id: "worldops.core", version: "0.1.0" }, {
  start: async () => runtime.cache.set("boot", { started: true }),
  stop: () => runtime.cache.remove("boot"),
});
runtime.modules.register({
  id: "worldops.room",
  version: "0.1.0",
  dependencies: ["worldops.core"],
}, {});
runtime.macros.register({
  id: "room.echo",
  version: "0.1.0",
  capabilities: ["room.message"],
}, ({ text }) => ({ text, echoed: true }));
runtime.widgets.register({
  id: "runtime.status",
  version: "0.1.0",
  deviceModes: ["desktop", "tablet", "mobile"],
}, ({ target: mountTarget, props }) => {
  const element = document.createElement("div");
  element.className = "demo-widget";
  element.textContent = props.text;
  mountTarget.replaceChildren(element);
  return () => mountTarget.replaceChildren();
});
runtime.events.on("demo.message", async payload => {
  const result = await runtime.macros.invoke("room.echo", payload, {
    capabilities: ["room.message"],
  });
  receiptOutput.textContent = JSON.stringify(result, null, 2);
});

function render() {
  statusOutput.textContent = JSON.stringify(runtime.status(), null, 2);
}

startButton.addEventListener("click", async () => {
  const receipt = await runtime.start({ capabilities: ["room.message"] });
  const mode = matchMedia("(max-width: 720px)").matches ? "mobile" : "desktop";
  const mount = await runtime.widgets.mount(
    "runtime.status",
    target,
    { text: `Runtime ready (${mode})` },
    { deviceMode: mode },
  );
  mountId = mount.mount_id;
  receiptOutput.textContent = JSON.stringify(receipt, null, 2);
  startButton.disabled = true;
  eventButton.disabled = false;
  stopButton.disabled = false;
  render();
});

eventButton.addEventListener("click", async () => {
  await runtime.events.emit(
    "demo.message",
    { text: "陽月：這是一筆合成測試訊息。" },
    { capabilities: ["room.message"] },
  );
  render();
});

stopButton.addEventListener("click", async () => {
  if (mountId) await runtime.widgets.unmount(mountId);
  mountId = null;
  const receipt = await runtime.stop({});
  receiptOutput.textContent = JSON.stringify(receipt, null, 2);
  startButton.disabled = false;
  eventButton.disabled = true;
  stopButton.disabled = true;
  render();
});

render();
