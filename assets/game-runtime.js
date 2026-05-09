(() => {
  "use strict";

  window.DaGoRuntimeManifest = Object.freeze({
    runtime_name: "da_go_unified_runtime",
    runtime_version: "1.3.0-unified-bootstrap",
    active_engine: "assets/game-corpus.js",
    target_database: "TRPG_Corpus_DB",
    export_format: "da_go_playlog_json_v2",
    staging_target: "stg.DaGo_PlayLog_Import -> stg.Utterance_Import",
    merged_sources: [
      "assets/game-corpus.js",
      "assets/game-direct.js",
      "assets/game-dol.js"
    ],
    integration_policy: {
      canonical_runtime: "assets/game-corpus.js",
      legacy_runtime_status: "reference_only",
      next_refactor: "move passage, event-pool, export mapping into separate data modules"
    }
  });

  const existing = document.querySelector('script[src="assets/game-corpus.js"]');
  if (existing) return;

  const script = document.createElement("script");
  script.src = "assets/game-corpus.js";
  script.defer = false;
  script.dataset.loadedBy = "assets/game-runtime.js";
  document.body.appendChild(script);
})();
