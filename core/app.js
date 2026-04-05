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

    window.navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("No se pudo registrar el service worker:", error);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const state = {
      form: {
        nombre: "",
        concepto: "",
        monto: "",
        montoValue: 0
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
      inputs: {
        nombre: document.getElementById("inputNombre"),
        concepto: document.getElementById("inputConcepto"),
        monto: document.getElementById("inputMonto")
      },
      suscripcion: {
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
        paymentMode: document.getElementById("premiumPaymentMode"),
        accountReference: document.getElementById("premiumAccountReference"),
        activationDate: document.getElementById("premiumActivationDate"),
        expirationDate: document.getElementById("premiumExpirationDate"),
        paymentReference: document.getElementById("premiumPaymentReference"),
        notice: document.getElementById("premiumNotice")
      },
      preview: {
        brand: document.getElementById("previewReceiptBrand"),
        name: document.getElementById("previewReceiptName"),
        concept: document.getElementById("previewReceiptConcept"),
        amount: document.getElementById("previewReceiptAmount"),
        date: document.getElementById("previewReceiptDate"),
        folio: document.getElementById("previewReceiptFolio")
      },
      qr: {
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
        premium: document.getElementById("confirmPremium")
      }
    };

    const splashScreen = ChrisApp.screens.splash.init({
      splash: elements.splash
    });

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

    function openHistory() {
      renderHistory();
      document.body.classList.add("history-open");
      elements.historyPanel.setAttribute("aria-hidden", "false");
    }

    function closeHistory() {
      document.body.classList.remove("history-open");
      elements.historyPanel.setAttribute("aria-hidden", "true");
    }

    const premiumManager = ChrisApp.premium.createManager({
      state,
      onChange() {
        suscripcion.render();
      }
    });

    const formulario = ChrisApp.screens.formulario.init({
      state,
      inputs: elements.inputs
    });

    const suscripcion = ChrisApp.screens.suscripcion.init({
      state,
      elements: elements.suscripcion,
      premiumManager
    });

    const preview = ChrisApp.screens.preview.init({
      state,
      elements: elements.preview
    });

    const qr = ChrisApp.screens.qr.init({
      state,
      elements: elements.qr
    });

    const confirmacion = ChrisApp.screens.confirmacion.init({
      state,
      elements: elements.confirmacion
    });

    elements.historyOpenButtons.forEach((button) => {
      button.addEventListener("click", openHistory);
    });

    elements.historyClose.addEventListener("click", closeHistory);
    elements.historyBackdrop.addEventListener("click", closeHistory);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeHistory();
      }
    });

    const navigator = ChrisApp.navigation.createNavigator({
      screens: [
        "screen-nombre",
        "screen-concepto",
        "screen-monto",
        "screen-suscripcion",
        "screen-preview",
        "screen-qr",
        "screen-confirmacion"
      ],
      beforeChange({ currentId }) {
        if (!formulario.validateForScreen(currentId)) {
          return false;
        }

        if (currentId === "screen-suscripcion") {
          return suscripcion.canAdvance();
        }

        return true;
      },
      afterChange({ nextId }) {
        closeHistory();

        if (nextId === "screen-suscripcion") {
          suscripcion.render();
        }

        if (nextId === "screen-preview") {
          preview.render();
        }

        if (nextId === "screen-qr") {
          qr.render();
          renderHistory();
        }

        if (nextId === "screen-confirmacion") {
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

        const didAdvance = navigator.next();

        if (!didAdvance) {
          sliderInstance.reset();
          return;
        }

        window.setTimeout(() => sliderInstance.reset(), 260);
      });

      sliderInstances.push(sliderInstance);
    });

    [elements.inputs.nombre, elements.inputs.concepto, elements.inputs.monto].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          navigator.next();
        }
      });
    });

    let swipeStart = null;

    document.addEventListener("touchstart", (event) => {
      if (document.body.classList.contains("history-open")) {
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
      if (!swipeStart || document.body.classList.contains("history-open")) {
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
    renderHistory();
    registerServiceWorker();
    await premiumManager.bootstrap();
    await premiumManager.validateReturnFlow();
    suscripcion.render();
    splashScreen.play();
  });
})(window, document);
