(() => {
  "use strict";

  window.DaGoRuntimeManifest = Object.freeze({
    runtime_name: "da_go_unified_runtime",
    runtime_version: "1.5.0-playable-check-rate",
    active_engine: "assets/game-playable-v2.js",
    target_database: "TRPG_Corpus_DB",
    export_format: "da_go_playlog_json_v2",
    staging_target: "stg.DaGo_Game_Run_Import / stg.DaGo_PlayLog_Import -> stg.Utterance_Import",
    merged_sources: [
      "assets/game-corpus.js",
      "assets/game-direct.js",
      "assets/game-dol.js"
    ],
    integration_policy: {
      canonical_runtime: "assets/game-playable-v2.js",
      legacy_runtime_status: "reference_only",
      current_focus: "playable checks, character build, staged export"
    }
  });

  const activeEngine = window.DaGoRuntimeManifest.active_engine;
  const existing = document.querySelector(`script[src^="${activeEngine}"]`);
  if (existing) return;
  const script = document.createElement("script");
  script.src = `${activeEngine}?v=${encodeURIComponent(window.DaGoRuntimeManifest.runtime_version)}`;
  script.defer = false;
  script.dataset.loadedBy = "assets/game-runtime.js";
  document.body.appendChild(script);
})();
