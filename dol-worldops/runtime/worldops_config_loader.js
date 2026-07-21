import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const SECRET_KEY = /(?:^|[_-])(password|passwd|secret|token|api[_-]?key|connection[_-]?string|private[_-]?key)(?:$|[_-])/i;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateTree(value, path = "config") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateTree(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new RuntimeContractError("UNSAFE_CONFIG_KEY", `unsafe config key at ${path}.${key}`);
    }
    if (SECRET_KEY.test(key)) {
      throw new RuntimeContractError("SECRET_IN_CLIENT_CONFIG", `secret-like key is not allowed in client config: ${path}.${key}`);
    }
    validateTree(child, `${path}.${key}`);
  }
}

function deepMerge(base, override) {
  if (!isRecord(base) || !isRecord(override)) return cloneValue(override);
  const output = cloneValue(base);
  for (const [key, value] of Object.entries(override)) {
    output[key] = isRecord(value) && isRecord(output[key])
      ? deepMerge(output[key], value)
      : cloneValue(value);
  }
  return output;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function readPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => current?.[key], value);
}

export class WorldOpsConfigLoader {
  constructor({
    defaults = {},
    requiredPaths = ["runtimeVersion", "schemaVersion"],
    fetcher = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null,
    now = () => new Date().toISOString(),
  } = {}) {
    assertRecord(defaults, "config defaults");
    if (!Array.isArray(requiredPaths) || requiredPaths.some(path => typeof path !== "string" || !path.trim())) {
      throw new RuntimeContractError("INVALID_REQUIRED_CONFIG_PATHS", "requiredPaths must contain non-empty strings");
    }
    validateTree(defaults, "defaults");
    this.defaults = cloneValue(defaults);
    this.requiredPaths = [...new Set(requiredPaths)];
    this.fetcher = fetcher;
    this.now = now;
    this.current = null;
    this.lastReceipt = null;
  }

  async #resolveSource(source) {
    if (typeof source === "function") return source();
    if (typeof source === "string") {
      if (!this.fetcher) throw new RuntimeContractError("CONFIG_FETCH_UNAVAILABLE", "no config fetcher is available");
      const response = await this.fetcher(source, { cache: "no-store", credentials: "same-origin" });
      if (!response?.ok) throw new RuntimeContractError("CONFIG_FETCH_FAILED", `config fetch failed: ${response?.status ?? "unknown"}`);
      return response.json();
    }
    return source ?? {};
  }

  async load(source = {}, overrides = {}) {
    const resolved = await this.#resolveSource(source);
    assertRecord(resolved, "config source");
    assertRecord(overrides, "config overrides");
    validateTree(resolved, "source");
    validateTree(overrides, "overrides");

    let config = deepMerge(this.defaults, resolved);
    config = deepMerge(config, overrides);
    config.formalRuntimeAllowed = false;
    config.clientCacheAuthoritative = false;
    config.canonAutoWrite = false;
    validateTree(config, "merged");

    const missing = this.requiredPaths.filter(path => {
      const value = readPath(config, path);
      return value === undefined || value === null || value === "";
    });
    if (missing.length) {
      throw new RuntimeContractError("MISSING_CONFIG_VALUES", "required configuration values are missing", { missing });
    }

    const receipt = {
      loaded_at: this.now(),
      source_type: typeof source === "string" ? "url" : typeof source === "function" ? "provider" : "object",
      config_hash: await hashRecord(config),
      required_paths: [...this.requiredPaths],
      formal_runtime_allowed: false,
    };
    this.current = deepFreeze(cloneValue(config));
    this.lastReceipt = deepFreeze(cloneValue(receipt));
    return { config: cloneValue(this.current), receipt: cloneValue(this.lastReceipt) };
  }
}
