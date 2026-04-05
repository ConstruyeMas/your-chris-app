# Your CHRIS App

Aplicacion web tipo PWA para generar recibos con identidad visual CHRIS, historial local y una base limpia para premium mensual con validacion de pago.

## Que incluye

- Splash de entrada con CHRIS como protagonista.
- Slider organico tipo brochazo para navegar entre pantallas.
- Fondos por pantalla sin recorte agresivo ni deformacion.
- Separacion clara entre preview visual y recibo real limpio.
- Historial local de recibos con nombre, concepto, monto, fecha, folio y estado premium.
- Arquitectura premium mensual lista para prueba local y compatible con Mercado Pago test.
- PWA lista para instalarse como **Your CHRIS App** en iPhone.

## Estructura principal

- `App_Recibo_Themes.html`: shell principal de la app.
- `core/`: logica de app, storage, premium, receipts, navigation, themes y slider.
- `screens/`: modulos de splash, formulario, suscripcion, preview, QR y confirmacion.
- `assets/icons/`: iconos oficiales de instalacion.
- `assets/themes/`: fondos por pantalla.
- `assets/templates/`: plantilla visual de preview y plantilla limpia del recibo real.
- `server/`: servidor local para servir la app y validar premium en modo prueba.
- `config/mercadopago.example.json`: ejemplo de configuracion para Mercado Pago test.

## Como correrla localmente

1. Abre este proyecto en VS Code.
2. Ejecuta:

```bash
npm run dev
```

3. Abre [http://localhost:8787/App_Recibo_Themes.html](http://localhost:8787/App_Recibo_Themes.html)

## Como probar premium

### Flujo local por defecto

La configuracion por defecto usa `mode: "mock"` para no depender de credenciales reales.

1. Llena nombre, concepto y monto.
2. En la pantalla premium pulsa **Pagar con Mercado Pago**.
3. Se abrira un checkout local de prueba.
4. Pulsa **Simular pago aprobado** para activar premium por 30 dias.
5. La app regresa al flujo y la premium queda activa.

### Flujo Mercado Pago test

1. Copia `config/mercadopago.example.json` a `config/mercadopago.local.json`.
2. Cambia:
   - `mercadoPago.mode` a `"mercadopago-test"`
   - `mercadoPago.publicKey`
   - `mercadoPago.accessToken`
   - `mercadoPago.notificationUrl`
   - `mercadoPago.publicBaseUrl`
3. Reinicia el servidor local.

La activacion premium real **no** depende del clic del boton. La app espera validacion del intento de pago y solo entonces activa premium por 30 dias.

## Donde configurar Mercado Pago

- Archivo local recomendado: `config/mercadopago.local.json`
- Archivo de ejemplo: `config/mercadopago.example.json`
- Endpoint webhook preparado: `POST /api/payments/webhook`
- Endpoint de creacion de intento: `POST /api/payments/create-intent`
- Endpoint de validacion: `GET /api/payments/validate`

## Instalacion en iPhone

1. Sirve la app desde `npm run dev`.
2. Abre la URL en Safari.
3. Usa **Compartir > Agregar a pantalla de inicio**.
4. El nombre de instalacion ya queda como **Your CHRIS App**.

Metadatos preparados:

- `manifest.webmanifest`
- `apple-touch-icon` 180x180
- `apple-mobile-web-app-title`
- `apple-mobile-web-app-status-bar-style`
- service worker para cache del shell

## Git y repositorio

El proyecto queda listo para repositorio Git local. Si despues quieres publicarlo manualmente en GitHub:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## Datos oficiales integrados

- Nombre de app: `Your CHRIS App`
- Soporte: `chris@yourchisapp.com`
- Cuenta Mercado Pago visible: `722969010773010312`

## Produccion real

Lo que ya queda listo:

- Base visual y modular.
- PWA instalable.
- Premium mensual con estado `active`, `pending`, `expired` e `inactive`.
- Historial local extendido.
- Servidor local con flujo mock y estructura de webhook.

Lo que falta para produccion real:

- Credenciales Mercado Pago test y luego produccion.
- URL publica para webhook.
- Validacion end-to-end con pagos reales aprobados en entorno oficial.
- Politica final de precio comercial si deseas cambiar el valor por defecto mostrado.
