(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const receipts = ChrisApp.receipts;
  const storage = ChrisApp.storage;
  const config = ChrisApp.config;

  function initQr(context) {
    const state = context.state;
    const elements = context.elements;

    function renderQr(receipt) {
      const qrPayload = receipts.createQrPayload(receipt);
      elements.qr.innerHTML = "";

      if (window.QRCode) {
        new window.QRCode(elements.qr, {
          text: JSON.stringify(qrPayload),
          width: 188,
          height: 188,
          colorDark: "#231f20",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });
        return;
      }

      elements.qr.innerHTML = `<div class="qr-fallback">QR no disponible sin conexion.<br>${receipt.folio}</div>`;
    }

    function ensureReceipt() {
      if (!state.currentReceipt) {
        state.currentReceipt = receipts.createReceipt(state.form, state.premium);
        storage.saveHistoryItem(state.currentReceipt);
      }

      return state.currentReceipt;
    }

    function render() {
      const receipt = ensureReceipt();

      elements.folio.textContent = receipt.folio;
      elements.date.textContent = receipt.fecha;
      elements.name.textContent = receipt.nombre;
      elements.concept.textContent = receipt.concepto;
      elements.amount.textContent = receipt.monto;
      elements.disclaimer.textContent = receipt.disclaimer;
      elements.premiumStatus.textContent = receipt.premiumStatusLabel;
      elements.qrMeta.textContent = `${config.appName} guarda historial local y conserva el estado premium al momento de emitir.`;

      renderQr(receipt);
    }

    return {
      render
    };
  }

  ChrisApp.screens.qr = {
    init: initQr
  };
})(window);
