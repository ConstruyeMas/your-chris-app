(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  const config = ChrisApp.config;

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("No se pudo leer el almacenamiento local:", error);
      return fallback;
    }
  }

  function normalizeHistoryEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    return {
      id: entry.id || "",
      folio: entry.folio || "",
      nombre: entry.nombre || "",
      concepto: entry.concepto || "",
      monto: entry.monto || "",
      montoValue: Number(entry.montoValue || 0),
      fecha: entry.fecha || "",
      fechaISO: entry.fechaISO || "",
      disclaimer: entry.disclaimer || "Recibo digital no fiscal",
      premiumStatus: entry.premiumStatus || "inactive",
      premiumStatusLabel: entry.premiumStatusLabel || "Normal",
      paymentReference: entry.paymentReference || ""
    };
  }

  function readHistory() {
    const raw = window.localStorage.getItem(config.storageKeys.history);
    const parsed = safeParse(raw || "[]", []);

    return parsed
      .map(normalizeHistoryEntry)
      .filter(Boolean);
  }

  function writeHistory(entries) {
    window.localStorage.setItem(config.storageKeys.history, JSON.stringify(entries));
  }

  function saveHistoryItem(entry) {
    const current = readHistory();
    const cleanEntry = normalizeHistoryEntry(entry);

    if (!cleanEntry || !cleanEntry.id) {
      return current;
    }

    const deduped = current.filter((item) => item.id !== cleanEntry.id);
    deduped.unshift(cleanEntry);

    const trimmed = deduped.slice(0, config.historyLimit);
    writeHistory(trimmed);
    return trimmed;
  }

  function readPremiumState() {
    return safeParse(window.localStorage.getItem(config.storageKeys.premium) || "null", null);
  }

  function writePremiumState(state) {
    window.localStorage.setItem(config.storageKeys.premium, JSON.stringify(state));
  }

  function getInstallationId() {
    const existing = window.localStorage.getItem(config.storageKeys.installation);

    if (existing) {
      return existing;
    }

    const generated = window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `install-${Date.now()}`;

    window.localStorage.setItem(config.storageKeys.installation, generated);
    return generated;
  }

  ChrisApp.storage = {
    getInstallationId,
    readHistory,
    saveHistoryItem,
    readPremiumState,
    writePremiumState
  };
})(window);
