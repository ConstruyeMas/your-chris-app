(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};

  function initSplash(elements) {
    const splash = elements.splash;

    function play() {
      splash.hidden = false;
      splash.classList.remove("is-exiting");
      splash.classList.add("is-visible");

      return new Promise((resolve) => {
        window.setTimeout(() => {
          splash.classList.add("is-exiting");

          window.setTimeout(() => {
            splash.classList.remove("is-visible");
            splash.hidden = true;
            splash.classList.remove("is-exiting");
            resolve();
          }, 560);
        }, ChrisApp.config.splashDurationMs);
      });
    }

    return {
      play
    };
  }

  ChrisApp.screens.splash = {
    init: initSplash
  };
})(window);
