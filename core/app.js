(function (window, document) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  function createHistoryItem(entry) {
    const article = document.createElement("article");
    article.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = entry.nombre || "Cliente sin nombre";

    const concept = document.createElement("span");
    concept.textContent = entry.concepto || "Sin concepto";

    const amount = document.createElement("span");
    amount.textContent = entry.monto || "Monto pendiente";

    const premium = document.createElement("span");
    premium.className = "history-premium";
    premium.textContent = entry.premiumStatusLabel || "Normal";
    premium.dataset.status = entry.premiumStatus || "inactive";

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const folio = document.createElement("span");
    folio.textContent = entry.folio || "Sin folio";

    const date = document.createElement("span");
    date.textContent = entry.fecha || "Sin fecha";

    meta.appendChild(folio);
    meta.appendChild(date);

    if (entry.paymentReference) {
      const reference = document.createElement("span");
      reference.textContent = entry.paymentReference;
      meta.appendChild(reference);
    }

    article.appendChild(title);
    article.appendChild(concept);
    article.appendChild(amount);
    article.appendChild(premium);
    article.appendChild(meta);

    return article;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in window.navigator)) {
      return;
    }

    if (!/^https?:/.test(window.location.protocol)) {
      return;
    }

    window.navigator.serviceWorker.register("./service-worker.js?v=20260405-flow-premium").catch((error) => {
      console.warn("No se pudo registrar el service worker:", error);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const state = {
      form: {
        nombre: "",
        concepto: "",
        monto: "",
        montoValue: 0,
        telefono: "",
        telefonoDigits: "",
        telefonoDestino: ""
      },
      currentReceipt: null,
      premium: ChrisApp.premium.normalizePremiumState(ChrisApp.storage.readPremiumState() || {})
    };

    const elements = {
      splash: document.getElementById("splashScreen"),
      historyPanel: document.getElementById("historyPanel"),
      historyBackdrop: document.getElementById("historyBackdrop"),
      historyClose: document.getElementById("historyClose"),
      historyList: document.getElementById("historyList"),
      historyCount: document.getElementById("historyCount"),
      historyOpenButtons: document.querySelectorAll("[data-history-open]"),
      backButton: document.getElementById("navBack"),
      chrisFloating: {
        root: document.getElementById("chris-floating"),
        image: document.querySelector("#chris-floating img")
      },
      inputs: {
        nombre: document.getElementById("inputNombre"),
        concepto: document.getElementById("inputConcepto"),
        monto: document.getElementById("inputMonto"),
        telefono: document.getElementById("inputCelular")
      },
      suscripcion: {
        root: document.getElementById("premium-modal"),
        closeButton: document.getElementById("premiumClose"),
        closeTargets: document.querySelectorAll("[data-premium-close]"),
        payButton: document.getElementById("payMercadoPago"),
        supportMail: document.getElementById("supportMail"),
        summaryName: document.getElementById("subscriptionName"),
        summaryConcept: document.getElementById("subscriptionConcept"),
        summaryAmount: document.getElementById("subscriptionAmount"),
        planName: document.getElementById("premiumPlanName"),
        planPrice: document.getElementById("premiumPlanPrice"),
        planCycle: document.getElementById("premiumPlanCycle"),
        statusBadge: document.getElementById("premiumStatusBadge"),
        statusDetail: document.getElementById("premiumStatusDetail"),
        paymentReferenceRow: document.getElementById("premiumPaymentReferenceRow"),
        paymentReference: document.getElementById("premiumPaymentReference"),
        notice: document.getElementById("premiumNotice")
      },
      receipt: {
        qr: document.getElementById("qrEmitir"),
        folio: document.getElementById("outputReceiptFolio"),
        date: document.getElementById("outputReceiptDate"),
        name: document.getElementById("outputReceiptName"),
        concept: document.getElementById("outputReceiptConcept"),
        amount: document.getElementById("outputReceiptAmount"),
        disclaimer: document.getElementById("outputReceiptDisclaimer"),
        premiumStatus: document.getElementById("outputReceiptPremium"),
        qrMeta: document.getElementById("qrMeta")
      },
      confirmacion: {
        whatsAppButton: document.getElementById("btnWhatsapp"),
        summary: document.getElementById("confirmSummary"),
        meta: document.getElementById("confirmMeta"),
        premium: document.getElementById("confirmPremium"),
        shareSummary: document.getElementById("shareSummary"),
        shareMeta: document.getElementById("shareMeta")
      }
    };

    renderBackButton("screen-nombre");

    const splashScreen = ChrisApp.screens.splash.init({
      splash: elements.splash
    });

    if (elements.chrisFloating.image) {
      elements.chrisFloating.image.dataset.currentSrc = elements.chrisFloating.image.getAttribute("src") || "";
    }

    const captureChrisPlacement = Object.freeze({
      right: "clamp(-40px, -3vw, -18px)",
      bottom: "clamp(10px, 1.8vh, 22px)",
      width: "clamp(206px, 31.2vh, 340px)",
      translateX: "0px",
      translateY: "0px",
      rotate: "-1deg"
    });

    const sharedChrisPlacement = Object.freeze({
      right: "clamp(-18px, -1.2vw, -8px)",
      bottom: "clamp(8px, 1.4vh, 14px)",
      width: "clamp(220px, 26vw, 320px)",
      translateX: "0px",
      translateY: "0px"
    });

    const finalChrisPlacement = Object.freeze({
      ...sharedChrisPlacement,
      width: captureChrisPlacement.width
    });

    const floatingChrisProfiles = Object.freeze({
      "screen-nombre": {
        ...captureChrisPlacement,
        image: "assets/chris/chris-nombre.png"
      },
      "screen-concepto": {
        ...captureChrisPlacement,
        image: "assets/chris/chris-concepto.png"
      },
      "screen-monto": {
        ...captureChrisPlacement,
        image: "assets/chris/chris-monto.png"
      },
      "screen-premium": {
        ...sharedChrisPlacement,
        image: "assets/chris/chris-premium.png",
        rotate: "0deg"
      },
      "screen-preview": {
        ...captureChrisPlacement,
        image: "assets/chris/chris-emitir.png"
      },
      "screen-confirmacion": {
        ...finalChrisPlacement,
        image: "assets/chris/chris-confirmacion.png",
        rotate: "-1deg"
      },
      "screen-envio": {
        ...finalChrisPlacement,
        image: "assets/chris/Repertorio CHRIS/chris-casual.png",
        rotate: "-1deg"
      }
    });

    function setFloatingChrisHost(host) {
      const root = elements.chrisFloating.root;

      if (!root || !host || root.parentElement === host) {
        return;
      }

      host.appendChild(root);
    }

    function swapFloatingChrisImage(nextImage) {
      const root = elements.chrisFloating.root;
      const image = elements.chrisFloating.image;

      if (!root || !image || !nextImage) {
        return;
      }

      if (image.dataset.currentSrc === nextImage) {
        root.classList.remove("is-swapping");
        return;
      }

      const clearSwapState = () => {
        root.classList.remove("is-swapping");
      };

      root.classList.add("is-swapping");
      image.addEventListener("load", clearSwapState, { once: true });
      image.addEventListener("error", clearSwapState, { once: true });
      image.dataset.currentSrc = nextImage;
      image.src = nextImage;
    }

    function renderFloatingChris(screenId) {
      const root = elements.chrisFloating.root;
      const image = elements.chrisFloating.image;

      if (!root || !image) {
        return;
      }

      const profile = floatingChrisProfiles[screenId];

      if (!profile) {
        delete root.dataset.screen;
        root.classList.remove("is-visible");
        return;
      }

      root.dataset.screen = screenId;
      swapFloatingChrisImage(profile.image);
      image.alt = "";
      root.style.setProperty("--chris-floating-left", profile.left || "auto");
      root.style.setProperty("--chris-floating-right", profile.right || "auto");
      root.style.setProperty("--chris-floating-top", profile.top || "auto");
      root.style.setProperty("--chris-floating-bottom", profile.bottom || "auto");
      root.style.setProperty("--chris-floating-width", profile.width || "clamp(120px, 16vw, 220px)");
      root.style.setProperty("--chris-floating-translate-x", profile.translateX || "0px");
      root.style.setProperty("--chris-floating-translate-y", profile.translateY || "0px");
      root.style.setProperty("--chris-floating-rotate", profile.rotate || "0deg");
      root.classList.add("is-visible");
    }

    function renderHistory() {
      const history = ChrisApp.storage.readHistory();
      elements.historyList.innerHTML = "";
      elements.historyCount.textContent = `${history.length} registro${history.length === 1 ? "" : "s"} guardados`;

      if (!history.length) {
        const empty = document.createElement("div");
        empty.className = "history-empty";
        empty.textContent = "Todavia no hay recibos guardados en este dispositivo.";
        elements.historyList.appendChild(empty);
        return;
      }

      history.forEach((entry) => {
        elements.historyList.appendChild(createHistoryItem(entry));
      });
    }

    function closeHistory() {
      document.body.classList.remove("history-open");
      elements.historyPanel.setAttribute("aria-hidden", "true");
    }

    function renderBackButton(screenId) {
      if (!elements.backButton) {
        return;
      }

      const shouldHide = !screenId || screenId === "screen-nombre";
      elements.backButton.hidden = shouldHide;
      elements.backButton.style.display = shouldHide ? "none" : "flex";
      elements.backButton.setAttribute("aria-hidden", String(shouldHide));
    }

    let suscripcion = null;
    let confirmacion = null;
    const premiumManager = ChrisApp.premium.createManager({
      state,
      onChange() {
        if (suscripcion) {
          suscripcion.render();
        }

        if (confirmacion) {
          confirmacion.render();
        }
      }
    });
    const defaultChrisHost = elements.chrisFloating.root ? elements.chrisFloating.root.parentElement : null;
    let navigator = null;

    const formulario = ChrisApp.screens.formulario.init({
      state,
      inputs: elements.inputs
    });

    suscripcion = ChrisApp.screens.suscripcion.init({
      state,
      elements: elements.suscripcion,
      premiumManager,
      onOpen() {
        setFloatingChrisHost(elements.suscripcion.root);
        renderFloatingChris("screen-premium");
      },
      onClose() {
        if (defaultChrisHost) {
          setFloatingChrisHost(defaultChrisHost);
        }

        renderFloatingChris(navigator ? navigator.getCurrentId() : "screen-nombre");
      }
    });

    const receiptPanel = ChrisApp.screens.qr.init({
      state,
      elements: elements.receipt
    });

    confirmacion = ChrisApp.screens.confirmacion.init({
      state,
      elements: elements.confirmacion,
      premiumManager,
      requestPremium() {
        suscripcion.open();
        suscripcion.showSendRequired();
      }
    });

    function openHistory() {
      suscripcion.close();
      renderHistory();
      document.body.classList.add("history-open");
      elements.historyPanel.setAttribute("aria-hidden", "false");
    }

    elements.historyOpenButtons.forEach((button) => {
      button.addEventListener("click", openHistory);
    });

    elements.historyClose.addEventListener("click", closeHistory);
    elements.historyBackdrop.addEventListener("click", closeHistory);
    elements.backButton.addEventListener("click", () => {
      if (!navigator || navigator.isTransitioning()) {
        return;
      }

      closeHistory();
      suscripcion.close();

      if (navigator.previous()) {
        window.setTimeout(resetSliders, 80);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (document.body.classList.contains("premium-open")) {
        suscripcion.close();
        return;
      }

      closeHistory();
    });

    navigator = ChrisApp.navigation.createNavigator({
      screens: [
        "screen-nombre",
        "screen-concepto",
        "screen-monto",
        "screen-preview",
        "screen-confirmacion",
        "screen-envio"
      ],
      beforeChange({ currentId, nextId }) {
        if (!formulario.validateForScreen(currentId)) {
          return false;
        }

        return true;
      },
      afterChange({ nextId }) {
        closeHistory();
        suscripcion.close();
        renderFloatingChris(nextId);
        renderBackButton(nextId);

        if (nextId === "screen-confirmacion" || nextId === "screen-envio") {
          receiptPanel.render();
          confirmacion.render();
          renderHistory();
        }
      }
    });

    const sliderInstances = [];

    function resetSliders() {
      sliderInstances.forEach((instance) => {
        instance.reset();
      });
    }

    function restartFlow() {
      closeHistory();
      suscripcion.close();
      formulario.reset();
      navigator.reset();
      window.setTimeout(resetSliders, 80);
      splashScreen.play();
      suscripcion.render();
    }

    document.querySelectorAll("[data-slider]").forEach((track) => {
      const action = track.dataset.sliderAction;
      let sliderInstance;

      sliderInstance = ChrisApp.slider.createSlider(track, () => {
        if (action === "restart") {
          restartFlow();
          window.setTimeout(() => sliderInstance.reset(), 120);
          return;
        }

        if (action === "send-whatsapp") {
          confirmacion.sendWhatsApp();
          window.setTimeout(() => sliderInstance.reset(), 260);
          return;
        }

        const didAdvance = navigator.next();

        if (!didAdvance) {
          sliderInstance.reset();
          return;
        }

        window.setTimeout(() => sliderInstance.reset(), 260);
      });

      sliderInstances.push(sliderInstance);
    });

    [elements.inputs.nombre, elements.inputs.concepto, elements.inputs.monto, elements.inputs.telefono].forEach((input) => {
      if (!input) {
        return;
      }

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          navigator.next();
        }
      });
    });

    let swipeStart = null;

    document.addEventListener("touchstart", (event) => {
      if (document.body.classList.contains("history-open") || document.body.classList.contains("premium-open")) {
        return;
      }

      if (event.target.closest("input, button, a, [data-slider]")) {
        return;
      }

      const touch = event.touches[0];
      swipeStart = {
        x: touch.clientX,
        y: touch.clientY
      };
    }, { passive: true });

    document.addEventListener("touchend", (event) => {
      if (!swipeStart || document.body.classList.contains("history-open") || document.body.classList.contains("premium-open")) {
        swipeStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeStart.x;
      const deltaY = touch.clientY - swipeStart.y;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

      if (deltaX < -80 && isHorizontal && !navigator.isTransitioning()) {
        navigator.next();
      }

      swipeStart = null;
    }, { passive: true });

    ChrisApp.themes.apply(document);
    navigator.setInitial();
    renderFloatingChris(navigator.getCurrentId());
    renderBackButton(navigator.getCurrentId());
    renderHistory();
    registerServiceWorker();
    await premiumManager.bootstrap();
    await premiumManager.validateReturnFlow();
    suscripcion.render();
    splashScreen.play();
  });
})(window, document);
