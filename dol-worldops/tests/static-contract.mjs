import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "config/runtime.config.json",
  "config/capabilities.json",
  "config/permission-policies.json",
  "config/worldops_module_manifest.schema.json",
  "config/worldops_boot_receipt.schema.json",
  "runtime/worldops_event_bus.js",
  "runtime/worldops_macro_registry.js",
  "runtime/worldops_widget_registry.js",
  "runtime/worldops_cache_adapter.js",
  "runtime/worldops_receipt_store.js",
  "runtime/worldops_error_boundary.js",
  "runtime/worldops_module_loader.js",
  "runtime/worldops_runtime_bridge.js",
  "runtime/worldops_config_loader.js",
  "runtime/worldops_capability_registry.js",
  "runtime/worldops_permission_gate.js",
  "runtime/worldops_session_handshake.js",
  "runtime/worldops_snapshot_manager.js",
  "runtime/worldops_boot_coordinator.js",
  "tests/runtime-contract.mjs",
  "tests/p02-boot-lifecycle.mjs",
  "tests/static-contract.mjs",
  "demo/index.html",
  "demo/demo.js",
  "demo/styles.css",
];

for (const path of required) await readFile(join(root, path), "utf8");

async function walk(dir) {
  const rows = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...await walk(path));
    else rows.push(path);
  }
  return rows;
}

const files = await walk(root);
const textFiles = files.filter(path => /\.(?:js|mjs|json|md|html|css|yml|yaml)$/i.test(path));
for (const path of textFiles) {
  const content = await readFile(path, "utf8");
  assert.equal(content.includes("\u0000"), false, `NUL found in ${relative(root, path)}`);
  assert.equal(content.includes("\ufffd"), false, `replacement character found in ${relative(root, path)}`);
}

const forbiddenExtensions = new Set([".twee", ".tw", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp3", ".ogg", ".wav", ".mp4", ".webm"]);
for (const path of files) {
  assert.equal(forbiddenExtensions.has(extname(path).toLowerCase()), false, `external narrative/media artifact found in ${relative(root, path)}`);
}

const executableFiles = files.filter(path => {
  const rel = relative(root, path).replaceAll("\\", "/");
  return /^(?:runtime|tests|demo|config)\//.test(rel) && /\.(?:js|mjs|html|css|json)$/i.test(path);
});
const forbiddenCode = [
  /DOL_NARRATIVE_IMPORT\s*=\s*true/i,
  /CANON_AUTO_WRITE\s*=\s*true/i,
  /CLIENT_CACHE_AUTHORITATIVE\s*=\s*true/i,
  /FORMAL_RUNTIME_ALLOWED\s*=\s*true/i,
  /\bDROP\s+TABLE\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
];
for (const path of executableFiles) {
  const content = await readFile(path, "utf8");
  for (const pattern of forbiddenCode) assert.equal(pattern.test(content), false, `forbidden pattern ${pattern} in ${relative(root, path)}`);
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(packageJson.type, "module");
assert.match(packageJson.scripts?.test || "", /p02-boot-lifecycle/);
const runtimeConfig = JSON.parse(await readFile(join(root, "config/runtime.config.json"), "utf8"));
assert.equal(runtimeConfig.formalRuntimeAllowed, false);
assert.equal(runtimeConfig.clientCacheAuthoritative, false);
assert.equal(runtimeConfig.canonAutoWrite, false);
for (const schemaPath of ["config/worldops_module_manifest.schema.json", "config/worldops_boot_receipt.schema.json"]) {
  const schema = JSON.parse(await readFile(join(root, schemaPath), "utf8"));
  assert.ok(schema.$schema);
  assert.equal(schema.type, "object");
}
const cache = await readFile(join(root, "runtime/worldops_cache_adapter.js"), "utf8");
assert.match(cache, /authoritative\s*=\s*false/);
assert.match(cache, /export\s*\{\s*MemoryStorage\s*\}/);
const moduleLoader = await readFile(join(root, "runtime/worldops_module_loader.js"), "utf8");
assert.match(moduleLoader, /async suspend/);
assert.match(moduleLoader, /async resume/);
assert.match(moduleLoader, /rollback/);
const coordinator = await readFile(join(root, "runtime/worldops_boot_coordinator.js"), "utf8");
assert.match(coordinator, /session_handshake/);
assert.match(coordinator, /autosnapshot/);
assert.match(coordinator, /formal_runtime_allowed:\s*false/);
const demo = await readFile(join(root, "demo/index.html"), "utf8");
assert.match(demo, /viewport/);
assert.match(demo, /suspendButton/);
assert.match(demo, /demo\.js/);
console.log(`PASS static contract (${required.length} required files; ${textFiles.length} text files scanned)`);
