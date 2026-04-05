(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  ChrisApp.screens = ChrisApp.screens || {};
  const config = ChrisApp.config;
  const receipts = ChrisApp.receipts;

  function initPreview(context) {
    const state = context.state;
    const elements = context.elements;

    function render() {
      const today = receipts.formatDate(new Date());
      const tempFolio = state.currentReceipt ? state.currentReceipt.folio : "Se genera al emitir";

      elements.name.textContent = state.form.nombre || "Cliente";
      elements.concept.textContent = state.form.concepto || "Concepto";
      elements.amount.textContent = state.form.monto || receipts.formatCurrency(0);
      elements.date.textContent = today;
      elements.folio.textContent = tempFolio;
      elements.brand.textContent = config.appName;
    }

    return {
      render
    };
  }

  ChrisApp.screens.preview = {
    init: initPreview
  };
})(window);
