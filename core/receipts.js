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

  function sanitizePhoneDigits(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  function getMexPhoneDigits(value) {
    let digits = sanitizePhoneDigits(value);

    if (!digits) {
      return "";
    }

    if (digits.startsWith("521") && digits.length > 10) {
      digits = digits.slice(3);
    } else if (digits.startsWith("52") && digits.length > 10) {
      digits = digits.slice(2);
    } else if (digits.startsWith("1") && digits.length === 11) {
      digits = digits.slice(1);
    }

    return digits.slice(0, 10);
  }

  function formatPhoneInput(value) {
    const digits = getMexPhoneDigits(value);

    if (!digits) {
      return "";
    }

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
  }

  function normalizeWhatsAppPhone(value) {
    const digits = getMexPhoneDigits(value);
    return digits.length === 10 ? `52${digits}` : "";
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

  function formatCompactFolio(folio) {
    const match = String(folio || "").match(/^CHR-(\d{4})(\d{2})(\d{2})/);

    if (!match) {
      return String(folio || "");
    }

    const [, year, month, day] = match;
    return `CHR-${year.slice(-2)}${month}/${day}`;
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
    const telefono = formatPhoneInput(formState.telefono);
    const telefonoDestino = normalizeWhatsAppPhone(formState.telefonoDestino || formState.telefono);
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
      telefono,
      telefonoDestino,
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
      celular: receipt.telefono || "",
      monto: receipt.monto,
      fecha: receipt.fecha,
      premium: receipt.premiumStatusLabel,
      nota: receipt.disclaimer
    };
  }

  function syncReceiptPremium(receipt, premiumState) {
    if (!receipt) {
      return null;
    }

    const premiumStatus = premiumState && premiumState.status ? premiumState.status : "inactive";

    return {
      ...receipt,
      premiumStatus,
      premiumStatusLabel: formatPremiumStatusLabel(premiumStatus),
      paymentReference: premiumState && premiumState.paymentReference ? premiumState.paymentReference : ""
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
    sanitizePhoneDigits,
    getMexPhoneDigits,
    formatPhoneInput,
    formatDate,
    formatPremiumStatusLabel,
    formatCompactFolio,
    normalizeWhatsAppPhone,
    createReceipt,
    createQrPayload,
    createWhatsAppMessage,
    syncReceiptPremium
  };
})(window);
