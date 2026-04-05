const fs = require("fs");
const path = require("path");
const sharedConfig = require(path.join(process.cwd(), "config", "shared-config.js"));

const DEFAULT_CONFIG = Object.freeze({
  appName: sharedConfig.appName,
  supportEmail: sharedConfig.supportEmail,
  mercadoPago: {
    mode: "mock",
    accountReference: sharedConfig.mercadoPago.accountReference,
    publicBaseUrl: "http://localhost:8787",
    publicKey: "",
    accessToken: "",
    notificationUrl: "",
    statementDescriptor: sharedConfig.mercadoPago.statementDescriptor
  },
  premiumPlan: {
    name: sharedConfig.premiumPlan.name,
    durationDays: sharedConfig.premiumPlan.durationDays,
    monthlyPrice: sharedConfig.premiumPlan.monthlyPrice,
    currency: sharedConfig.premiumPlan.currency
  }
});

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  const merged = { ...base };

  Object.keys(override || {}).forEach((key) => {
    if (isObject(base[key]) && isObject(override[key])) {
      merged[key] = deepMerge(base[key], override[key]);
      return;
    }

    merged[key] = override[key];
  });

  return merged;
}

function loadLocalConfig() {
  const filePath = path.join(process.cwd(), "config", "mercadopago.local.json");

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer config/mercadopago.local.json: ${error.message}`);
  }
}

function loadConfig() {
  const localConfig = loadLocalConfig();
  return deepMerge(DEFAULT_CONFIG, localConfig);
}

function hasMercadoPagoCredentials(config) {
  return Boolean(
    config.mercadoPago.mode === "mercadopago-test" &&
    config.mercadoPago.publicKey &&
    config.mercadoPago.accessToken
  );
}

module.exports = {
  loadConfig,
  hasMercadoPagoCredentials
};
