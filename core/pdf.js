(function (window) {
  const ChrisApp = window.ChrisApp || (window.ChrisApp = {});

  // Pre-load template PNG as data URL at script init so it is ready when PDF fires
  var _bg = null; // { dataUrl, w, h }
  var _bgReady = new Promise(function (resolve) {
    var img = new window.Image();
    img.onload = function () {
      try {
        var c = document.createElement("canvas");
        c.width  = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        _bg = { dataUrl: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
      } catch (e) {}
      resolve();
    };
    img.onerror = function () { resolve(); };
    img.src = "assets/img/tu recibo digital (10).png";
  });

  // Pull QR canvas from the DOM (rendered by qrcodejs into #qrEmitir)
  function getQrDataUrl() {
    try {
      var el = document.getElementById("qrEmitir");
      var cv = el && el.querySelector("canvas");
      return cv ? cv.toDataURL("image/png") : null;
    } catch (e) {
      return null;
    }
  }

  // Internal: builds and returns a fully-drawn jsPDF document for the given receipt.
  // Callers decide the output: .save() for download, .output("blob") for sharing.
  function _buildDoc(receipt) {
    if (!window.jspdf || !window.jspdf.jsPDF) return null;
    var doc = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Palette
    var DARK    = [28,  26,  24 ];
    var AMBER   = [185, 100, 18 ];
    var WHITE   = [255, 255, 255];
    var STRIP   = [234, 229, 222];
    var LABEL   = [148, 140, 130];
    var DIVIDER = [213, 206, 198];
    var GREEN   = [30,  118, 74 ];
    var SHADOW  = [190, 184, 178];
    var FOOT    = [168, 161, 152];

    // Layout
    var cx = 12, cy = 62, cw = 186, R = 4, pad = 11;
    var hH = 32, fH = 14, qrSize = 40;

    // Pre-compute wrapped text heights so card height is known before drawing
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    var nombreLines  = doc.splitTextToSize(receipt.nombre   || "-", cw / 2 - pad - 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    var conceptoLines = doc.splitTextToSize(receipt.concepto || "-", cw - pad * 2);

    var nombreH   = nombreLines.length  * 6;
    var conceptoH = conceptoLines.length * 5.5;

    // innerH = sum of all y-increments between header bottom and footer top (+ 4 mm breathing room)
    var innerH = (10 + 6 + Math.max(nombreH, 10) + 6)   // row: cliente + fecha
               + (10 + 6 + conceptoH + 6)                // row: concepto
               + (10 + 7 + 14 + 10)                      // row: monto
               + (10 + qrSize + 10)                       // row: QR + estado
               + 4;                                       // breathing room before footer

    var cardH = hH + innerH + fH;

    // ── Background PNG (scale to A4 width, preserve ratio, clips at page bottom) ──
    if (_bg && _bg.dataUrl && _bg.w > 0) {
      var bgRendH = Math.round(210 * (_bg.h / _bg.w));
      doc.addImage(_bg.dataUrl, "PNG", 0, 0, 210, bgRendH);
    }

    // ── Card shadow ──────────────────────────────────────────────────────────
    doc.setFillColor(SHADOW[0], SHADOW[1], SHADOW[2]);
    doc.roundedRect(cx + 2, cy + 2, cw, cardH, R, R, "F");

    // ── Card body ────────────────────────────────────────────────────────────
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.roundedRect(cx, cy, cw, cardH, R, R, "F");

    // ── Header (dark, rounded top only) ─────────────────────────────────────
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.roundedRect(cx, cy, cw, hH, R, R, "F");
    doc.rect(cx, cy + hH - R, cw, R, "F");             // flatten bottom corners

    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.rect(cx, cy + hH - 1.3, cw, 1.3, "F");         // amber accent stripe

    // App name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text("Your CHRIS App", cx + pad, cy + 13);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(172, 164, 154);
    doc.text("Comprobante digital", cx + pad, cy + 21);

    // Folio badge (right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.text(receipt.folio || "-", cx + cw - pad, cy + 13, { align: "right" });

    // ── Content ──────────────────────────────────────────────────────────────
    var y = cy + hH;
    var halfW = cw / 2;

    // Row 1 — CLIENTE (left) | FECHA (right)
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
    doc.text("CLIENTE", cx + pad, y);
    doc.text("FECHA",   cx + halfW, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(nombreLines, cx + pad, y);

    doc.setFontSize(9);
    var fechaLabel = (receipt.fecha || "-").split(",")[0].trim();
    doc.text(fechaLabel, cx + halfW, y);

    y += Math.max(nombreH, 10) + 6;

    // Divider
    doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
    doc.setLineWidth(0.3);
    doc.line(cx, y, cx + cw, y);

    // Row 2 — CONCEPTO
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
    doc.text("CONCEPTO", cx + pad, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(conceptoLines, cx + pad, y);
    y += conceptoH + 6;

    // Divider
    doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
    doc.line(cx, y, cx + cw, y);

    // Row 3 — MONTO
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
    doc.text("MONTO RECIBIDO", cx + pad, y);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.text(receipt.monto || "-", cx + pad, y + 7);
    y += 14 + 10;

    // Divider
    doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
    doc.line(cx, y, cx + cw, y);

    // Row 4 — QR (right) + ESTADO (left)
    y += 10;
    var qrX = cx + cw - pad - qrSize;

    var qrDataUrl = getQrDataUrl();
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
    } else {
      // Placeholder when QR canvas is not available
      doc.setFillColor(STRIP[0], STRIP[1], STRIP[2]);
      doc.roundedRect(qrX, y, qrSize, qrSize, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
      doc.text("QR", qrX + qrSize / 2, y + qrSize / 2, { align: "center" });
    }

    // Estado column (left of QR)
    var estadoW = cw - pad * 2 - qrSize - 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
    doc.text("ESTADO", cx + pad, y);

    // Green "Comprobante emitido" pill
    var pillH = 7.5;
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.roundedRect(cx + pad, y + 4, estadoW, pillH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text("Comprobante emitido", cx + pad + estadoW / 2, y + 4 + pillH * 0.63, { align: "center" });

    // Premium row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(LABEL[0], LABEL[1], LABEL[2]);
    doc.text("PREMIUM", cx + pad, y + 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(receipt.premiumStatusLabel || "Normal", cx + pad, y + 24.5);

    y += qrSize + 10;

    // ── Divider before footer ────────────────────────────────────────────────
    doc.setDrawColor(DIVIDER[0], DIVIDER[1], DIVIDER[2]);
    doc.line(cx, y, cx + cw, y);

    // ── Footer (dark, rounded bottom only) ──────────────────────────────────
    var footerY = cy + cardH - fH;
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.roundedRect(cx, footerY, cw, fH, R, R, "F");
    doc.rect(cx, footerY, cw, R, "F");                  // flatten top corners

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(FOOT[0], FOOT[1], FOOT[2]);
    doc.text(
      receipt.disclaimer || "Recibo digital no fiscal",
      cx + cw / 2,
      footerY + fH * 0.62,
      { align: "center" }
    );

    return doc;
  }

  // Public: downloads the PDF to the device (existing behavior — unchanged)
  function generateReceiptPDF(receipt) {
    var doc = _buildDoc(receipt);
    if (doc) {
      doc.save("recibo-" + receipt.folio + ".pdf");
    }
  }

  // Public: builds the PDF and returns a Promise<Blob|null> for Web Share API.
  // Waits for the background image before building — guarantees full design.
  function generateReceiptBlob(receipt) {
    var wait = _bg !== null ? Promise.resolve() : _bgReady;
    return wait.then(function () {
      if (!_bg) { return null; }
      var doc = _buildDoc(receipt);
      return doc ? doc.output("blob") : null;
    });
  }

  ChrisApp.pdf = {
    generate:      generateReceiptPDF,
    generateBlob:  generateReceiptBlob
  };
})(window);
