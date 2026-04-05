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
- `config/shared-config.js`: datos oficiales compartidos entre frontend y backend.
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
2. Ese archivo ya esta ignorado por Git en `.gitignore`, asi que puedes dejar ahi solo credenciales de prueba.
3. Cambia:
   - `mercadoPago.mode` a `"mercadopago-test"`
   - `mercadoPago.publicKey`
   - `mercadoPago.accessToken`
   - `mercadoPago.notificationUrl`
   - `mercadoPago.publicBaseUrl`
4. Reinicia el servidor local.

La activacion premium real **no** depende del clic del boton. La app crea un intento, queda en `pending` y solo cambia a `active` cuando la validacion del pago regresa como aprobada.

Estados soportados:

- `inactive`
- `pending`
- `active`
- `expired`

## Donde configurar Mercado Pago

- Archivo local recomendado: `config/mercadopago.local.json`
- Archivo de ejemplo: `config/mercadopago.example.json`
- Endpoint webhook preparado: `POST /api/payments/webhook`
- Endpoint de creacion de intento: `POST /api/payments/create-intent`
- Endpoint de validacion: `GET /api/payments/validate`

### Notification URL publica

- En local puedes seguir trabajando sin una URL publica real usando `mode: "mock"`.
- Cuando pruebes `mercadopago-test`, coloca la URL publica real en `mercadoPago.notificationUrl`.
- El punto preparado para recibirla ya existe en `POST /api/payments/webhook`.
- No se deja ninguna URL publica hardcodeada en el repo.

## Instalacion en iPhone

1. Sirve la app desde `npm run dev`.
2. Abre la URL en Safari.
3. Usa **Compartir > Agregar a pantalla de inicio**.
4. El nombre de instalacion ya queda como **Your CHRIS App**.

Metadatos preparados:

- `manifest.webmanifest`
- `manifest.id` y `manifest.scope`
- `apple-touch-icon` 180x180
- `apple-mobile-web-app-title`
- `apple-mobile-web-app-status-bar-style`
- `application-name`
- `display: standalone`
- `start_url: ./App_Recibo_Themes.html`
- service worker para cache del shell

Checklist tecnico revisado:

- Nombre oficial configurado: `Your CHRIS App`
- Iconos locales referenciados sin rutas rotas
- `viewport-fit=cover` presente
- modo standalone activado
- sin validacion fisica en iPhone aun

## Git y repositorio

El proyecto queda listo para repositorio Git local. Si despues quieres vincularlo a un remoto existente en GitHub:

```bash
git remote add origin <URL_DEL_REPO>
git push -u origin main
```

Si `origin` ya existe, valida con:

```bash
git remote -v
```

## GitHub Pages

El proyecto queda preparado para publicar desde:

- Branch: `main`
- Folder: `/ (root)`
- URL raiz esperada del repo: `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`

Puntos ya ajustados para Pages:

- `index.html` en raiz para que GitHub Pages abra la app desde `/`
- assets, scripts, manifest e iconos con rutas relativas
- service worker compatible con subruta de repo

Limite actual de GitHub Pages:

- GitHub Pages sirve solo archivos estaticos
- el flujo premium con `create-intent`, `validate` y `webhook` necesita backend aparte
- la app se puede abrir en Safari e instalar como PWA, pero premium test no se valida desde Pages sin un endpoint externo

## Datos oficiales integrados

- Nombre de app: `Your CHRIS App`
- Soporte: `chris@yourchisapp.com`
- Cuenta Mercado Pago visible: `722969010773010312`
- Precio premium centralizado: `config/shared-config.js`

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
