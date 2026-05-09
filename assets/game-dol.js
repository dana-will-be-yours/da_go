(() => {
  "use strict";

  window.DaGoLegacyRuntime = Object.assign({}, window.DaGoLegacyRuntime || {}, {
    "assets/game-dol.js": "redirected-to-game-runtime"
  });

  if (document.querySelector('script[src^="assets/game-runtime.js"]') || document.querySelector('script[src^="assets/game-playable-v6.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "assets/game-runtime.js?v=1.11.0-changshan-year";
  script.defer = false;
  script.dataset.loadedBy = "assets/game-dol.js";
  document.body.appendChild(script);
})();
