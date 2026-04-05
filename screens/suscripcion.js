(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const config = ChrisApp.config;
  const receipts = ChrisApp.receipts;

  function formatDate(value) {
    if (!value) {
      return "Sin activar";
    }

    return receipts.formatDate(new Date(value));
  }

  function initSuscripcion(context) {
    const state = context.state;
    const elements = context.elements;
    const premiumManager = context.premiumManager;
    let closeTimer = null;

    function showAdvanceRequired() {
      elements.notice.textContent = "Necesitas una premium activa para continuar al preview y emitir recibos.";
    }

    function render() {
      const premiumState = state.premium;
      const statusMeta = premiumManager.getStatusMeta();

      elements.supportMail.textContent = config.supportEmail;
      elements.supportMail.href = `mailto:${config.supportEmail}`;
      elements.summaryName.textContent = state.form.nombre || "Pendiente";
      elements.summaryConcept.textContent = state.form.concepto || "Pendiente";
      elements.summaryAmount.textContent = state.form.monto || "Pendiente";
      elements.planName.textContent = premiumState.planName || config.premiumPlan.name;
      elements.planPrice.textContent = premiumState.monthlyPriceLabel || config.premiumPlan.monthlyPriceLabel;
      elements.planCycle.textContent = premiumState.cycleLabel || config.premiumPlan.cycleLabel;
      elements.accountReference.textContent = config.mercadoPago.accountReference;
      elements.statusBadge.textContent = statusMeta.label;
      elements.statusBadge.dataset.status = statusMeta.tone;
      elements.statusDetail.textContent = premiumState.apiAvailable
        ? `Estado sincronizado para esta instalacion: ${statusMeta.label.toLowerCase()}.`
        : "Sin API local activa. Inicia el servidor para probar la validacion premium.";
      elements.paymentMode.textContent = premiumState.mode === "mercadopago-test"
        ? "Mercado Pago test"
        : "Modo prueba local";
      elements.activationDate.textContent = formatDate(premiumState.activationDate);
      elements.expirationDate.textContent = formatDate(premiumState.expirationDate);
      elements.paymentReference.textContent = premiumState.paymentReference || "Se asigna al aprobar el pago";

      if (premiumState.status === "active") {
        elements.notice.textContent = "Tu premium esta activa. Ya puedes continuar al preview y emitir recibos.";
      } else if (premiumState.status === "pending") {
        elements.notice.textContent = "Tu pago esta pendiente de validacion. En modo prueba se activa al aprobar el checkout local.";
      } else if (premiumState.status === "expired") {
        elements.notice.textContent = "Tu premium vencio. Activa un nuevo pago mensual para continuar.";
      } else {
        elements.notice.textContent = "La activacion premium dura 30 dias y solo se confirma con pago aprobado.";
      }

      elements.payButton.classList.remove("is-loading");
    }

    function open() {
      render();
      window.clearTimeout(closeTimer);
      elements.root.hidden = false;
      elements.root.setAttribute("aria-hidden", "false");
      document.body.classList.add("premium-open");

      window.requestAnimationFrame(() => {
        elements.root.classList.add("is-open");
      });
    }

    function close() {
      if (elements.root.hidden) {
        return;
      }

      elements.root.classList.remove("is-open");
      elements.root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("premium-open");
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        elements.root.hidden = true;
      }, 240);
    }

    elements.payButton.addEventListener("click", async (event) => {
      event.preventDefault();
      render();
      elements.notice.textContent = "Preparando intento de pago...";
      elements.payButton.classList.add("is-loading");

      try {
        await premiumManager.startCheckout(state.form);
      } catch (error) {
        console.error("No se pudo iniciar el pago:", error);
        elements.notice.textContent = "No se pudo iniciar el pago. Usa npm run dev para habilitar la validacion local.";
        elements.payButton.classList.remove("is-loading");
      }
    });

    elements.closeButton.addEventListener("click", close);
    elements.closeTargets.forEach((target) => {
      target.addEventListener("click", close);
    });

    function canAdvance() {
      const isPremiumActive = premiumManager.canUsePremium();

      if (!isPremiumActive) {
        open();
        showAdvanceRequired();
      }

      return isPremiumActive;
    }

    return {
      canAdvance,
      close,
      open,
      render,
      showAdvanceRequired
    };
  }

  ChrisApp.screens.suscripcion = {
    init: initSuscripcion
  };
})(window);
