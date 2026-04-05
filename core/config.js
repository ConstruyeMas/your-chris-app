(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  ChrisApp.config = Object.freeze({
    appName: "Your CHRIS App",
    companyName: "Your CHRIS App",
    locale: "es-MX",
    timezone: "America/Mexico_City",
    apiBase: "/api",
    storageKeys: Object.freeze({
      history: "your-chris-app.receipt-history",
      installation: "your-chris-app.installation-id",
      premium: "your-chris-app.premium-state"
    }),
    historyLimit: 50,
    splashDurationMs: 2400,
    transitionMs: 520,
    supportEmail: "chris@yourchisapp.com",
    mercadoPago: Object.freeze({
      accountReference: "722969010773010312",
      checkoutMockPath: "/mock-mercadopago-checkout.html"
    }),
    premiumPlan: Object.freeze({
      name: "Your CHRIS App Premium Mensual",
      durationDays: 30,
      monthlyPrice: 149,
      currency: "MXN",
      monthlyPriceLabel: "$149 MXN / mes",
      cycleLabel: "Activacion mensual por 30 dias"
    }),
    whatsappPhone: "521234567890"
  });
})(window);
