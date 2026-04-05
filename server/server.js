const http = require("http");
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("./config");
const {
  completeMockPayment,
  createPaymentIntent,
  getPremiumPayload,
  getValidationPayload,
  handleWebhook
} = require("./payment-service");

const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = process.cwd();
const config = loadConfig();
config.mercadoPago.checkoutMockPath = "/mock-mercadopago-checkout.html";
config.mercadoPago.publicBaseUrl = config.mercadoPago.publicBaseUrl || `http://localhost:${PORT}`;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, {
    error: message
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString("utf8");
    });

    request.on("end", () => {
      resolve(body ? JSON.parse(body) : {});
    });

    request.on("error", reject);
  });
}

function serveStaticFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      sendError(response, 404, "Archivo no encontrado.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType
    });
    response.end(fileBuffer);
  });
}

function safeFilePath(urlPathname) {
  const normalizedPath = path.normalize(path.join(ROOT_DIR, urlPathname));

  if (!normalizedPath.startsWith(ROOT_DIR)) {
    return null;
  }

  return normalizedPath;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://localhost:${PORT}`);

  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/premium/status") {
      const installationId = requestUrl.searchParams.get("installationId");

      if (!installationId) {
        sendError(response, 400, "installationId es obligatorio.");
        return;
      }

      sendJson(response, 200, getPremiumPayload(installationId, config));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/payments/create-intent") {
      const body = await readRequestBody(request);
      const installationId = body.installationId;

      if (!installationId) {
        sendError(response, 400, "installationId es obligatorio.");
        return;
      }

      const payload = await createPaymentIntent(installationId, body.customerSnapshot || {}, config);
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/payments/validate") {
      const installationId = requestUrl.searchParams.get("installationId");
      const intentId = requestUrl.searchParams.get("intentId");

      if (!installationId || !intentId) {
        sendError(response, 400, "installationId e intentId son obligatorios.");
        return;
      }

      sendJson(response, 200, getValidationPayload(intentId, installationId, config));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/payments/mock-complete") {
      const body = await readRequestBody(request);
      const payload = completeMockPayment(
        body.intentId,
        body.installationId,
        body.status,
        config
      );
      sendJson(response, 200, payload);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/payments/webhook") {
      const body = await readRequestBody(request);
      const payload = await handleWebhook(body, config);
      sendJson(response, 200, payload);
      return;
    }

    const pathname = requestUrl.pathname === "/" ? "/App_Recibo_Themes.html" : requestUrl.pathname;
    const filePath = safeFilePath(pathname.replace(/^\//, ""));

    if (!filePath) {
      sendError(response, 403, "Ruta no permitida.");
      return;
    }

    serveStaticFile(response, filePath);
  } catch (error) {
    console.error(error);
    sendError(response, 500, error.message || "Error interno del servidor.");
  }
});

server.listen(PORT, () => {
  console.log(`Your CHRIS App disponible en http://localhost:${PORT}`);
});
