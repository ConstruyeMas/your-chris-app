(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const receipts = ChrisApp.receipts;
  const config = ChrisApp.config;

  function initConfirmacion(context) {
    const state = context.state;
    const elements = context.elements;

    elements.whatsAppButton.addEventListener("click", () => {
      if (!state.currentReceipt) {
        return;
      }

      const message = receipts.createWhatsAppMessage(state.currentReceipt);
      const targetUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(message)}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    });

    function render() {
      if (!state.currentReceipt) {
        elements.summary.textContent = "Todavia no hay un recibo generado.";
        elements.meta.textContent = "Completa el flujo para crear el comprobante.";
        elements.premium.textContent = "Estado premium sin registro";
        return;
      }

      elements.summary.textContent = `${state.currentReceipt.nombre} · ${state.currentReceipt.monto}`;
      elements.meta.textContent = `${state.currentReceipt.folio} · ${state.currentReceipt.fecha}`;
      elements.premium.textContent = `Estado premium al emitir: ${state.currentReceipt.premiumStatusLabel}`;
    }

    return {
      render
    };
  }

  ChrisApp.screens.confirmacion = {
    init: initConfirmacion
  };
})(window);
