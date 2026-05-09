(() => {
  "use strict";

  window.DaGoLegacyRuntime = Object.assign({}, window.DaGoLegacyRuntime || {}, {
    "assets/game-corpus.js": "redirected-to-game-runtime"
  });

  if (document.querySelector('script[src^="assets/game-runtime.js"]') || document.querySelector('script[src^="assets/game-playable-v6.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "assets/game-runtime.js?v=1.11.0-changshan-year";
  script.dataset.loadedBy = "assets/game-corpus.js";
  document.body.appendChild(script);
})();
