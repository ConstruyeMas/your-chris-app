(function (root, factory) {
  const config = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = config;
  }

  root.ChrisSharedConfig = Object.freeze(config);
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    appName: "Your CHRIS App",
    companyName: "Your CHRIS App",
    locale: "es-MX",
    timezone: "America/Mexico_City",
    supportEmail: "chris@yourchisapp.com",
    mercadoPago: {
      accountReference: "722969010773010312",
      statementDescriptor: "YOURCHRISAPP"
    },
    premiumPlan: {
      name: "Your CHRIS App Premium Mensual",
      durationDays: 30,
      monthlyPrice: 149,
      currency: "MXN"
    }
  };
});
