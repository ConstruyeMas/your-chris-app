(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const receipts = ChrisApp.receipts;
  const storage = ChrisApp.storage;
  const config = ChrisApp.config;

  function initConfirmacion(context) {
    const state = context.state;
    const elements = context.elements;
    const premiumManager = context.premiumManager;
    const requestPremium = typeof context.requestPremium === "function" ? context.requestPremium : null;

    function syncReceipt() {
      if (!state.currentReceipt) {
        return null;
      }

      state.currentReceipt = receipts.syncReceiptPremium(state.currentReceipt, state.premium);
      storage.saveHistoryItem(state.currentReceipt);
      return state.currentReceipt;
    }

    elements.whatsAppButton.addEventListener("click", () => {
      const receipt = syncReceipt();

      if (!receipt) {
        return;
      }

      if (!premiumManager.canUsePremium()) {
        if (requestPremium) {
          requestPremium();
        }
        return;
      }

      const message = receipts.createWhatsAppMessage(receipt);
      const targetUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(message)}`;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    });

    function render() {
      const receipt = syncReceipt();

      if (!receipt) {
        elements.summary.textContent = "Todavia no hay un recibo generado.";
        elements.meta.textContent = "Completa el flujo para crear el comprobante.";
        elements.premium.textContent = "Estado premium sin registro";
        elements.shareSummary.textContent = "Todavia no hay un recibo listo.";
        elements.shareMeta.textContent = "Completa el flujo para preparar el envio.";
        elements.sharePremium.textContent = "Premium se valida solo antes del envio.";
        elements.shareName.textContent = "-";
        elements.shareConcept.textContent = "-";
        elements.shareAmount.textContent = "-";
        elements.shareFolio.textContent = "-";
        return;
      }

      elements.summary.textContent = `${receipt.nombre} - ${receipt.monto}`;
      elements.meta.textContent = `${receipt.folio} - ${receipt.fecha}`;
      elements.premium.textContent = `Estado premium del recibo: ${receipt.premiumStatusLabel}`;
      elements.shareSummary.textContent = "Todo listo para compartir.";
      elements.shareMeta.textContent = `${receipt.folio} - ${receipt.fecha}`;
      elements.sharePremium.textContent = premiumManager.canUsePremium()
        ? "Premium activa. Ya puedes enviarlo por WhatsApp."
        : "Premium se solicitara solo cuando confirmes el envio.";
      elements.shareName.textContent = receipt.nombre;
      elements.shareConcept.textContent = receipt.concepto;
      elements.shareAmount.textContent = receipt.monto;
      elements.shareFolio.textContent = receipt.folio;
    }

    return {
      render
    };
  }

  ChrisApp.screens.confirmacion = {
    init: initConfirmacion
  };
})(window);
