(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  const config = ChrisApp.config;
  const storage = ChrisApp.storage;
  const receipts = ChrisApp.receipts;

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizePremiumState(raw) {
    const source = raw || {};
    const expirationDate = source.expirationDate || "";
    let status = source.status || "inactive";

    if (status === "active" && expirationDate) {
      const isExpired = new Date(expirationDate).getTime() < Date.now();

      if (isExpired) {
        status = "expired";
      }
    }

    return {
      status,
      activationDate: source.activationDate || "",
      expirationDate,
      paymentReference: source.paymentReference || "",
      lastIntentId: source.lastIntentId || "",
      paymentStatus: source.paymentStatus || "idle",
      mode: source.mode || "mock",
      installationId: source.installationId || storage.getInstallationId(),
      apiAvailable: source.apiAvailable === true,
      updatedAt: source.updatedAt || nowIso(),
      planName: source.planName || config.premiumPlan.name,
      monthlyPriceLabel: source.monthlyPriceLabel || config.premiumPlan.monthlyPriceLabel,
      cycleLabel: source.cycleLabel || config.premiumPlan.cycleLabel
    };
  }

  function statusMeta(status) {
    const map = {
      active: {
        label: "Activa",
        tone: "active"
      },
      pending: {
        label: "Pendiente",
        tone: "pending"
      },
      expired: {
        label: "Vencida",
        tone: "expired"
      },
      inactive: {
        label: "Normal",
        tone: "inactive"
      }
    };

    return map[status] || map.inactive;
  }

  async function requestJson(url, options) {
    const response = await window.fetch(url, {
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    return response.json();
  }

  function createPremiumManager(options) {
    const state = options.state;

    function syncPremium(nextState) {
      state.premium = normalizePremiumState({
        ...state.premium,
        ...nextState
      });
      storage.writePremiumState(state.premium);

      if (typeof options.onChange === "function") {
        options.onChange(state.premium);
      }

      return state.premium;
    }

    function updateFromServer(payload) {
      return syncPremium({
        ...payload.premium,
        mode: payload.mode || state.premium.mode,
        apiAvailable: true,
        planName: payload.planName || config.premiumPlan.name,
        monthlyPriceLabel: payload.monthlyPriceLabel || config.premiumPlan.monthlyPriceLabel,
        cycleLabel: payload.cycleLabel || config.premiumPlan.cycleLabel
      });
    }

    async function bootstrap() {
      syncPremium(storage.readPremiumState() || {
        installationId: storage.getInstallationId()
      });

      try {
        const payload = await requestJson(`${config.apiBase}/premium/status?installationId=${encodeURIComponent(state.premium.installationId)}`);
        updateFromServer(payload);
      } catch (error) {
        syncPremium({
          apiAvailable: false,
          updatedAt: nowIso()
        });
      }
    }

    async function validateReturnFlow() {
      const url = new URL(window.location.href);
      const intentId = url.searchParams.get("intent_id");
      const paymentStatus = url.searchParams.get("payment_status");

      if (!intentId) {
        return null;
      }

      try {
        const payload = await requestJson(`${config.apiBase}/payments/validate?installationId=${encodeURIComponent(state.premium.installationId)}&intentId=${encodeURIComponent(intentId)}`);
        const premiumState = updateFromServer(payload);

        if (paymentStatus) {
          premiumState.paymentStatus = paymentStatus;
          syncPremium(premiumState);
        }

        url.searchParams.delete("intent_id");
        url.searchParams.delete("payment_status");
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ""));
        return premiumState;
      } catch (error) {
        console.warn("No se pudo validar el retorno de pago:", error);
        return null;
      }
    }

    async function startCheckout(customerSnapshot) {
      const payload = await requestJson(`${config.apiBase}/payments/create-intent`, {
        method: "POST",
        body: JSON.stringify({
          installationId: state.premium.installationId,
          customerSnapshot: {
            nombre: receipts.sanitizeText(customerSnapshot.nombre),
            concepto: receipts.sanitizeText(customerSnapshot.concepto),
            monto: customerSnapshot.monto,
            montoValue: Number(customerSnapshot.montoValue || 0)
          }
        })
      });

      updateFromServer(payload);
      syncPremium({
        status: "pending",
        paymentStatus: payload.paymentStatus || "pending",
        lastIntentId: payload.intentId || "",
        paymentReference: payload.paymentReference || ""
      });

      window.location.href = payload.checkoutUrl;
    }

    function canUsePremium() {
      return state.premium.status === "active";
    }

    function getStatusMeta() {
      return statusMeta(state.premium.status);
    }

    return {
      bootstrap,
      canUsePremium,
      getStatusMeta,
      normalizePremiumState,
      startCheckout,
      syncPremium,
      validateReturnFlow
    };
  }

  ChrisApp.premium = {
    createManager,
    normalizePremiumState,
    statusMeta
  };
})(window);
