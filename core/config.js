(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});
  const shared = window.ChrisSharedConfig || {};
  const sharedPremiumPlan = shared.premiumPlan || {};
  const monthlyPrice = Number(sharedPremiumPlan.monthlyPrice || 149);
  const currency = sharedPremiumPlan.currency || "MXN";

  ChrisApp.config = Object.freeze({
    appName: shared.appName || "Your CHRIS App",
    companyName: shared.companyName || "Your CHRIS App",
    locale: shared.locale || "es-MX",
    timezone: shared.timezone || "America/Mexico_City",
    apiBase: "./api",
    storageKeys: Object.freeze({
      history: "your-chris-app.receipt-history",
      installation: "your-chris-app.installation-id",
      premium: "your-chris-app.premium-state"
    }),
    historyLimit: 50,
    splashDurationMs: 2400,
    transitionMs: 520,
    supportEmail: shared.supportEmail || "chris@yourchisapp.com",
    mercadoPago: Object.freeze({
      accountReference: (shared.mercadoPago && shared.mercadoPago.accountReference) || "722969010773010312",
      checkoutMockPath: "./mock-mercadopago-checkout.html"
    }),
    premiumPlan: Object.freeze({
      name: sharedPremiumPlan.name || "Your CHRIS App Premium Mensual",
      durationDays: Number(sharedPremiumPlan.durationDays || 30),
      monthlyPrice,
      currency,
      monthlyPriceLabel: `$${monthlyPrice} ${currency} / mes`,
      cycleLabel: `Activacion mensual por ${Number(sharedPremiumPlan.durationDays || 30)} dias`
    }),
    whatsappPhone: "521234567890"
  });
})(window);
