(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  const config = ChrisApp.config;

  function randomSuffix() {
    return Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  }

  function sanitizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function parseAmount(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function formatCurrency(number) {
    const amount = Number(number || 0);
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.premiumPlan.currency,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatCurrencyInput(value) {
    const amount = parseAmount(value);
    return amount ? formatCurrency(amount) : "";
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(config.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: config.timezone
    }).format(date);
  }

  function generateFolio(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `CHR-${year}${month}${day}-${randomSuffix()}`;
  }

  function formatPremiumStatusLabel(status) {
    const labels = {
      active: "Premium activa",
      expired: "Premium vencida",
      pending: "Premium pendiente",
      inactive: "Normal"
    };

    return labels[status] || "Normal";
  }

  function createReceipt(formState, premiumState) {
    const now = new Date();
    const nombre = sanitizeText(formState.nombre);
    const concepto = sanitizeText(formState.concepto);
    const montoValue = Number(formState.montoValue || 0);
    const monto = montoValue ? formatCurrency(montoValue) : "";
    const folio = generateFolio(now);
    const id = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${folio}-${Date.now()}`;
    const premiumStatus = premiumState && premiumState.status ? premiumState.status : "inactive";

    return {
      id,
      folio,
      nombre,
      concepto,
      monto,
      montoValue,
      fecha: formatDate(now),
      fechaISO: now.toISOString(),
      disclaimer: "Recibo digital no fiscal",
      premiumStatus,
      premiumStatusLabel: formatPremiumStatusLabel(premiumStatus),
      paymentReference: premiumState && premiumState.paymentReference ? premiumState.paymentReference : ""
    };
  }

  function createQrPayload(receipt) {
    return {
      app: config.appName,
      folio: receipt.folio,
      cliente: receipt.nombre,
      concepto: receipt.concepto,
      monto: receipt.monto,
      fecha: receipt.fecha,
      premium: receipt.premiumStatusLabel,
      nota: receipt.disclaimer
    };
  }

  function createWhatsAppMessage(receipt) {
    return [
      `*${config.appName}*`,
      "-----------------------------",
      "*RECIBO DIGITAL*",
      `Folio: ${receipt.folio}`,
      `Cliente: ${receipt.nombre}`,
      `Concepto: ${receipt.concepto}`,
      `Monto: ${receipt.monto}`,
      `Fecha: ${receipt.fecha}`,
      `Estado premium: ${receipt.premiumStatusLabel}`,
      "-----------------------------",
      receipt.disclaimer
    ].join("\n");
  }

  ChrisApp.receipts = {
    sanitizeText,
    parseAmount,
    formatCurrency,
    formatCurrencyInput,
    formatDate,
    formatPremiumStatusLabel,
    createReceipt,
    createQrPayload,
    createWhatsAppMessage
  };
})(window);
