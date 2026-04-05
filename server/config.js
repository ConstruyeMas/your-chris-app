const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG = Object.freeze({
  appName: "Your CHRIS App",
  supportEmail: "chris@yourchisapp.com",
  mercadoPago: {
    mode: "mock",
    accountReference: "722969010773010312",
    publicBaseUrl: "http://localhost:8787",
    publicKey: "",
    accessToken: "",
    notificationUrl: "",
    statementDescriptor: "YOURCHRISAPP"
  },
  premiumPlan: {
    name: "Your CHRIS App Premium Mensual",
    durationDays: 30,
    monthlyPrice: 149,
    currency: "MXN"
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

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
