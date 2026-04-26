(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const receipts = ChrisApp.receipts;
  const storage = ChrisApp.storage;

  function initConfirmacion(context) {
    const state = context.state;
    const elements = context.elements;
    const premiumManager = context.premiumManager;
    const requestPremium = typeof context.requestPremium === "function" ? context.requestPremium : null;
    const freeSendsKey = "your-chris-app.free-sends";
    const freeSendsLimit = 2;

    function setText(element, value) {
      if (element) {
        element.textContent = value;
      }
    }

    function syncReceipt() {
      if (!state.currentReceipt) {
        return null;
      }

      state.currentReceipt = receipts.syncReceiptPremium(state.currentReceipt, state.premium);
      storage.saveHistoryItem(state.currentReceipt);
      return state.currentReceipt;
    }

    function readFreeSends() {
      const count = Number(window.localStorage.getItem(freeSendsKey) || "0");
      return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
    }

    function incrementFreeSends() {
      const nextCount = readFreeSends() + 1;
      window.localStorage.setItem(freeSendsKey, String(nextCount));
      return nextCount;
    }

    let sendLock = false;

    function sendWhatsApp() {
      if (sendLock) {
        return;
      }

      sendLock = true;

      const receipt = syncReceipt();

      if (!receipt) {
        sendLock = false;
        return;
      }

      const destination = receipts.normalizeWhatsAppPhone(
        receipt.telefonoDestino
        || state.form.telefonoDestino
        || receipt.telefono
        || state.form.telefono
      );

      if (!destination) {
        sendLock = false;
        return;
      }

      const isFreemium = !premiumManager.canUsePremium();

      if (isFreemium) {
        const currentCount = readFreeSends();

        if (currentCount + 1 > freeSendsLimit) {
          if (requestPremium) {
            requestPremium();
          }
          sendLock = false;
          return;
        }
      }

      const blobPromise = ChrisApp.pdf && ChrisApp.pdf.generateBlob
        ? ChrisApp.pdf.generateBlob(receipt)
        : Promise.resolve(null);

      blobPromise.then(function (blob) {
        if (blob && navigator.canShare && navigator.share) {
          const file = new File([blob], "recibo-" + receipt.folio + ".pdf", { type: "application/pdf" });
          const shareData = { files: [file], title: "Recibo", text: "Comprobante digital" };

          if (navigator.canShare(shareData)) {
            navigator.share(shareData).then(function () {
              if (isFreemium) {
                incrementFreeSends();
              }
            }).catch(function () {});
            return;
          }
        }

        if (isFreemium) {
          incrementFreeSends();
        }

        if (ChrisApp.pdf) {
          ChrisApp.pdf.generate(receipt);
        }

        const message = receipts.createWhatsAppMessage(receipt);
        const targetUrl = "https://wa.me/" + destination + "?text=" + encodeURIComponent(message);
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      });
    }

    elements.whatsAppButton.addEventListener("click", sendWhatsApp);

    function render() {
      sendLock = false;
      const receipt = syncReceipt();

      if (!receipt) {
        setText(elements.summary, "Todavia no hay un recibo generado.");
        setText(elements.meta, "Completa el flujo para crear el comprobante.");
        setText(elements.premium, "Estado premium sin registro");
        setText(elements.shareSummary, "Todavia no hay un recibo listo.");
        setText(elements.shareMeta, "Completa el flujo para compartirlo.");
        return;
      }

      setText(elements.summary, `${receipt.nombre} - ${receipt.monto}`);
      setText(elements.meta, `${receipt.folio} - ${receipt.fecha}`);
      setText(elements.premium, `Estado premium del recibo: ${receipt.premiumStatusLabel}`);
      setText(elements.shareSummary, "Escanea o comparte el recibo.");
      setText(elements.shareMeta, `${receipt.folio} - ${receipt.fecha}`);
    }

    return {
      render,
      sendWhatsApp
    };
  }

  ChrisApp.screens.confirmacion = {
    init: initConfirmacion
  };
})(window);
