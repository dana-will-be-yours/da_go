(() => {
  "use strict";
  window.DaGoRuntimeManifest = Object.freeze({
    runtime_name: "da_go_unified_runtime",
    runtime_version: "1.7.0-seasonal-authoring-v4",
    active_engine: "assets/game-playable-v4.js",
    target_database: "TRPG_Corpus_DB",
    export_format: "da_go_playlog_json_v2",
    staging_target: "stg.DaGo_PlayLog_Import -> stg.Utterance_Import",
    canonical_runtime: "assets/game-playable-v4.js"
  });
  const activeEngine = window.DaGoRuntimeManifest.active_engine;
  if (document.querySelector(`script[src^="${activeEngine}"]`)) return;
  const script = document.createElement("script");
  script.src = `${activeEngine}?v=${encodeURIComponent(window.DaGoRuntimeManifest.runtime_version)}`;
  script.defer = false;
  script.dataset.loadedBy = "assets/game-runtime.js";
  document.body.appendChild(script);
})();
