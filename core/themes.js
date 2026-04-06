(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  const registry = Object.freeze({
    "screen-nombre": {
      src: "assets/themes/nombre.png",
      opacity: "0.94",
      maxWidth: "660px",
      shiftX: "-18px",
      shiftY: "0px"
    },
    "screen-concepto": {
      src: "assets/themes/concepto.png",
      opacity: "0.94",
      maxWidth: "660px",
      shiftX: "-12px",
      shiftY: "0px"
    },
    "screen-monto": {
      src: "assets/themes/monto.png",
      opacity: "0.94",
      maxWidth: "660px",
      shiftX: "-8px",
      shiftY: "0px"
    },
    "screen-preview": {
      src: "assets/themes/preview.png",
      opacity: "0.92",
      maxWidth: "660px",
      shiftX: "0px",
      shiftY: "0px"
    },
    "screen-confirmacion": {
      src: "assets/themes/confirmacion.png",
      opacity: "0.92",
      maxWidth: "660px",
      shiftX: "0px",
      shiftY: "0px"
    },
    "screen-envio": {
      src: "assets/themes/qr.png",
      opacity: "0.92",
      maxWidth: "660px",
      shiftX: "0px",
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
      screen.style.setProperty("--screen-bg-shift-x", theme.shiftX || "0px");
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
