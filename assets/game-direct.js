(() => {
  "use strict";

  window.DaGoLegacyRuntime = Object.assign({}, window.DaGoLegacyRuntime || {}, {
    "assets/game-direct.js": "redirected-to-game-runtime"
  });

  if (document.querySelector('script[src^="assets/game-runtime.js"]') || document.querySelector('script[src^="assets/game-corpus.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "assets/game-runtime.js?v=1.4.4-sidebar-status";
  script.defer = false;
  script.dataset.loadedBy = "assets/game-direct.js";
  document.body.appendChild(script);
})();
