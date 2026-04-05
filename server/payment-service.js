const crypto = require("crypto");
const { readStore, writeStore } = require("./store");
const { hasMercadoPagoCredentials } = require("./config");

function nowIso() {
  return new Date().toISOString();
}

function addDays(isoString, days) {
  const date = new Date(isoString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function statusLabel(status) {
  const labels = {
    active: "Activa",
    pending: "Pendiente",
    expired: "Vencida",
    inactive: "Normal"
  };

  return labels[status] || "Normal";
}

function syncPremiumRecord(record) {
  if (!record) {
    return {
      status: "inactive",
      activationDate: "",
      expirationDate: "",
      paymentReference: "",
      lastIntentId: "",
      paymentStatus: "idle",
      updatedAt: nowIso()
    };
  }

  if (record.status === "active" && record.expirationDate) {
    const expired = new Date(record.expirationDate).getTime() < Date.now();

    if (expired) {
      record.status = "expired";
    }
  }

  record.updatedAt = nowIso();
  return record;
}

function getPremiumPayload(installationId, config) {
  const store = readStore();
  const premiumRecord = syncPremiumRecord(store.premiums[installationId]);
  store.premiums[installationId] = premiumRecord;
  writeStore(store);

  return {
    mode: hasMercadoPagoCredentials(config) ? "mercadopago-test" : "mock",
    planName: config.premiumPlan.name,
    monthlyPriceLabel: `$${config.premiumPlan.monthlyPrice} ${config.premiumPlan.currency} / mes`,
    cycleLabel: `Activacion mensual por ${config.premiumPlan.durationDays} dias`,
    premium: premiumRecord
  };
}

function createIntentRecord(installationId, customerSnapshot, config) {
  const store = readStore();
  const intentId = crypto.randomUUID();
  const paymentReference = `MP-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
  const providerMode = hasMercadoPagoCredentials(config) ? "mercadopago-test" : "mock";
  const checkoutUrl = providerMode === "mock"
    ? `${config.mercadoPago.publicBaseUrl}${config.mercadoPago.checkoutMockPath || "/mock-mercadopago-checkout.html"}?intent=${encodeURIComponent(intentId)}&installationId=${encodeURIComponent(installationId)}`
    : "";

  const intentRecord = {
    id: intentId,
    installationId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: "pending",
    paymentStatus: "pending",
    paymentReference,
    customerSnapshot,
    providerMode,
    providerReference: "",
    checkoutUrl
  };

  store.intents[intentId] = intentRecord;
  store.premiums[installationId] = syncPremiumRecord({
    ...(store.premiums[installationId] || {}),
    status: "pending",
    paymentStatus: "pending",
    paymentReference,
    lastIntentId: intentId,
    updatedAt: nowIso()
  });
  writeStore(store);

  return intentRecord;
}

async function createMercadoPagoPreference(intentRecord, config) {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          title: config.premiumPlan.name,
          quantity: 1,
          unit_price: Number(config.premiumPlan.monthlyPrice),
          currency_id: config.premiumPlan.currency
        }
      ],
      external_reference: intentRecord.id,
      notification_url: config.mercadoPago.notificationUrl || undefined,
      back_urls: {
        success: `${config.mercadoPago.publicBaseUrl}/App_Recibo_Themes.html?payment_status=approved&intent_id=${encodeURIComponent(intentRecord.id)}`,
        failure: `${config.mercadoPago.publicBaseUrl}/App_Recibo_Themes.html?payment_status=rejected&intent_id=${encodeURIComponent(intentRecord.id)}`,
        pending: `${config.mercadoPago.publicBaseUrl}/App_Recibo_Themes.html?payment_status=pending&intent_id=${encodeURIComponent(intentRecord.id)}`
      },
      auto_return: "approved",
      metadata: {
        installation_id: intentRecord.installationId,
        intent_id: intentRecord.id
      },
      statement_descriptor: config.mercadoPago.statementDescriptor
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "No se pudo crear la preferencia de Mercado Pago");
  }

  return response.json();
}

async function createPaymentIntent(installationId, customerSnapshot, config) {
  const intentRecord = createIntentRecord(installationId, customerSnapshot, config);

  if (hasMercadoPagoCredentials(config)) {
    const preference = await createMercadoPagoPreference(intentRecord, config);
    const store = readStore();
    store.intents[intentRecord.id] = {
      ...store.intents[intentRecord.id],
      checkoutUrl: preference.sandbox_init_point || preference.init_point,
      providerReference: preference.id || ""
    };
    writeStore(store);
  }

  return getValidationPayload(intentRecord.id, installationId, config);
}

function activatePremium(installationId, paymentReference, config) {
  const store = readStore();
  const activationDate = nowIso();
  const expirationDate = addDays(activationDate, config.premiumPlan.durationDays);

  store.premiums[installationId] = syncPremiumRecord({
    ...(store.premiums[installationId] || {}),
    status: "active",
    activationDate,
    expirationDate,
    paymentReference,
    paymentStatus: "approved",
    updatedAt: nowIso()
  });
  writeStore(store);

  return store.premiums[installationId];
}

function completeMockPayment(intentId, installationId, decision, config) {
  const store = readStore();
  const intent = store.intents[intentId];

  if (!intent || intent.installationId !== installationId) {
    throw new Error("Intento de pago no encontrado para esta instalacion.");
  }

  intent.updatedAt = nowIso();
  intent.paymentStatus = decision;
  intent.status = decision;
  writeStore(store);

  if (decision === "approved") {
    activatePremium(installationId, intent.paymentReference, config);
  } else if (decision === "pending") {
    store.premiums[installationId] = syncPremiumRecord({
      ...(store.premiums[installationId] || {}),
      status: "pending",
      paymentStatus: "pending",
      paymentReference: intent.paymentReference,
      lastIntentId: intentId
    });
    writeStore(store);
  } else {
    store.premiums[installationId] = syncPremiumRecord({
      ...(store.premiums[installationId] || {}),
      status: "inactive",
      paymentStatus: decision,
      paymentReference: intent.paymentReference,
      lastIntentId: intentId
    });
    writeStore(store);
  }

  return getValidationPayload(intentId, installationId, config);
}

function getValidationPayload(intentId, installationId, config) {
  const store = readStore();
  const intent = store.intents[intentId];
  const premiumPayload = getPremiumPayload(installationId, config);

  return {
    ...premiumPayload,
    intentId,
    checkoutUrl: intent ? intent.checkoutUrl : "",
    paymentStatus: intent ? intent.paymentStatus : premiumPayload.premium.paymentStatus,
    paymentReference: intent ? intent.paymentReference : premiumPayload.premium.paymentReference
  };
}

async function handleWebhook(payload, config) {
  const store = readStore();
  store.notifications.unshift({
    receivedAt: nowIso(),
    payload
  });
  store.notifications = store.notifications.slice(0, 50);
  writeStore(store);

  if (!hasMercadoPagoCredentials(config)) {
    return { ok: true, mode: "mock" };
  }

  const paymentId = payload && payload.data && payload.data.id;
  const notificationType = payload && payload.type;

  if (!paymentId || notificationType !== "payment") {
    return { ok: true, mode: "mercadopago-test", processed: false };
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${config.mercadoPago.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error("No se pudo validar el pago reportado por Mercado Pago.");
  }

  const payment = await response.json();
  const installationId = payment.metadata && payment.metadata.installation_id;
  const intentId = payment.metadata && payment.metadata.intent_id;

  if (intentId) {
    const currentStore = readStore();
    if (currentStore.intents[intentId]) {
      currentStore.intents[intentId].paymentStatus = payment.status || "pending";
      currentStore.intents[intentId].status = payment.status || "pending";
      currentStore.intents[intentId].providerReference = String(payment.id || paymentId);
      currentStore.intents[intentId].updatedAt = nowIso();
      writeStore(currentStore);
    }
  }

  if (payment.status === "approved" && installationId) {
    activatePremium(installationId, payment.id || paymentId, config);
  }

  return {
    ok: true,
    mode: "mercadopago-test",
    processed: true,
    paymentId,
    intentId: intentId || "",
    paymentStatus: payment.status || "pending"
  };
}

module.exports = {
  completeMockPayment,
  createPaymentIntent,
  getPremiumPayload,
  getValidationPayload,
  handleWebhook,
  statusLabel
};
