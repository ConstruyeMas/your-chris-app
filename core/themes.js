(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  const registry = Object.freeze({
    "screen-nombre": {
      src: "assets/themes/nombre.png",
      opacity: "0.98",
      maxWidth: "760px",
      shiftY: "0px"
    },
    "screen-concepto": {
      src: "assets/themes/concepto.png",
      opacity: "0.98",
      maxWidth: "760px",
      shiftY: "0px"
    },
    "screen-monto": {
      src: "assets/themes/monto.png",
      opacity: "0.98",
      maxWidth: "760px",
      shiftY: "0px"
    },
    "screen-suscripcion": {
      src: "assets/themes/suscripcion.png",
      opacity: "0.9",
      maxWidth: "760px",
      shiftY: "10px"
    },
    "screen-preview": {
      src: "assets/themes/preview.png",
      opacity: "0.84",
      maxWidth: "720px",
      shiftY: "0px"
    },
    "screen-qr": {
      src: "assets/themes/qr.png",
      opacity: "0.8",
      maxWidth: "720px",
      shiftY: "0px"
    },
    "screen-confirmacion": {
      src: "assets/themes/confirmacion.png",
      opacity: "0.88",
      maxWidth: "760px",
      shiftY: "0px"
    }
  });

  function apply(root) {
    Object.keys(registry).forEach((screenId) => {
      const screen = root.getElementById(screenId);
      const theme = registry[screenId];

      if (!screen || !theme) {
        return;
      }

      const image = screen.querySelector("[data-background-image]");

      if (!image) {
        return;
      }

      screen.style.setProperty("--screen-bg-opacity", theme.opacity);
      screen.style.setProperty("--screen-bg-max-width", theme.maxWidth || "760px");
      screen.style.setProperty("--screen-bg-shift-y", theme.shiftY || "0px");
      image.src = theme.src;
      image.alt = "";

      image.addEventListener("error", function handleError() {
        screen.dataset.themeState = "missing";
        image.removeEventListener("error", handleError);
      });
    });
  }

  ChrisApp.themes = {
    registry,
    apply
  };
})(window);
