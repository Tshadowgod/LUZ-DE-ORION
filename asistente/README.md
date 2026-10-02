# Asistente personal (Telegram / WhatsApp)

Le cuentas por **texto o por audio** lo que tienes que hacer y te lo recuerda.
Si falta algo (día, hora, lugar, qué llevar, cuánto antes avisarte) te pregunta
antes de guardarlo.

```
Tú:   🎙️ "mañana tengo dentista a las 10"
Bot:  Dentista, mañana 10:00. ¿Dónde es, tienes que llevar algo
      y cuánto antes te aviso?
Tú:   en la Clínica Sur, llevar las radiografías, una hora antes
Bot:  ✅ Anotado: Dentista
      🗓️ mañana 10:00
      📝 Clínica Sur. Llevar las radiografías
      🔔 Te aviso 60 min antes y a la hora.

(al día siguiente, 09:00)
Bot:  🔔 En 60 min (10:00): Dentista
(10:00)
Bot:  ⏰ Es hora: Dentista       [✅ Hecho] [⏰ +10 min] [⏰ +1 hora]
```

También entiende:

- "¿Qué tengo hoy?", "¿qué tengo pendiente?" (o `/hoy`, `/lista`)
- "Ya fui al dentista" → la marca como hecha
- "Pasa lo del dentista al jueves a las 4" → la reprograma
- "Cancela lo de la luz"
- "Todos los lunes a las 8 sacar la basura" → se repite cada semana
- Cada mañana (07:00) manda un resumen de lo que tienes ese día.

## Cómo está armado

Es un Worker de Cloudflare aparte de la tienda, en esta carpeta. Todo entra en
planes gratuitos y **no pide tarjeta**:

| Pieza | Servicio | Gratis |
|---|---|---|
| Bot | Cloudflare Workers | 100.000 pedidos/día |
| Tareas | Cloudflare D1 | 5 GB |
| Audio → texto | Workers AI (Whisper) | dentro de 10.000 neuronas/día |
| Entender los mensajes | Workers AI (Llama 3.3 70B) | ~80 mensajes/día |
| Avisos | Cron de Cloudflare, cada minuto | incluido |
| Chat | Telegram | gratis |

Opcional: si cargas una clave de Claude (`ANTHROPIC_API_KEY`), usa Claude para
entender los mensajes. Entiende mejor las fechas y los detalles, pero se paga
por uso (ver al final).

## ¿Por qué Telegram primero y no WhatsApp?

Se puede usar con los dos, pero para un asistente personal **Telegram es mucho
más simple**:

| | Telegram | WhatsApp (Cloud API de Meta) |
|---|---|---|
| Crear el bot | 1 minuto con @BotFather | Cuenta de Meta Business, app de desarrollador y un número propio para el bot |
| Notas de voz | Sí | Sí |
| Avisos | Siempre, gratis | Gratis solo hasta 24 h después de tu último mensaje. Fuera de esa ventana Meta exige una **plantilla aprobada** y cobra cada aviso |
| Tarjeta | No | Sí, para los avisos con plantilla |
| Número del bot | No hace falta | Un número que **no** esté usado en la app de WhatsApp |

Recomendación: arranca con Telegram (gratis y listo hoy). Si después quieres
WhatsApp, el mismo bot ya lo soporta: solo hay que cargar los datos de Meta
(sección 6).

---

## 1. Crear el bot de Telegram

1. En Telegram, abre **@BotFather** y escribe `/newbot`.
2. Elige un nombre ("Mi Asistente") y un usuario que termine en `bot`.
3. Te da un **token** (`123456789:AA...`). Guárdalo, es la llave del bot.

## 2. Instalar

```bash
cd asistente
npm install
npx wrangler login            # si no lo hiciste ya por la tienda
```

## 3. Crear la base de datos

```bash
npx wrangler d1 create asistente
```

Copia el `database_id` que muestra y pégalo en `wrangler.jsonc`, en lugar de
`PEGAR_ACA_EL_ID_DE_D1`. Después crea las tablas:

```bash
npm run db:crear
```

## 4. Cargar los secretos

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN   # el token de BotFather
npx wrangler secret put TELEGRAM_SECRETO     # inventa un texto largo: letras, números, _ y -
```

Revisa en `wrangler.jsonc`:

- `ZONA_HORARIA`: viene `America/La_Paz`. Si vives en otro lado cámbiala
  (`America/Argentina/Buenos_Aires`, `America/Lima`, `America/Bogota`,
  `America/Mexico_City`, `Europe/Madrid`...).
- `HORA_RESUMEN`: hora del resumen diario (vacío para no recibirlo).
- `AVISO_PREVIO_MIN`: aviso previo cuando no dices cuánto antes (30 min).

## 5. Publicar y conectar

```bash
npm run deploy
```

Te muestra la dirección del Worker, algo como
`https://luz-asistente.TU-CUENTA.workers.dev`. Abre en el navegador, una sola vez:

```
https://luz-asistente.TU-CUENTA.workers.dev/telegram/configurar?secreto=EL_TELEGRAM_SECRETO
```

Debe responder `"listo": true`. Ahora:

1. Escríbele "hola" a tu bot en Telegram. Te contesta con **tu id** (`tg:12345678`).
2. Pon ese id en `USUARIOS_PERMITIDOS` dentro de `wrangler.jsonc`
   (varios se separan con comas).
3. `npm run deploy` otra vez. Listo: ya puedes mandarle audios y mensajes.

Así nadie más puede usar tu bot ni gastar tu cuota de IA.

## 6. (Opcional) WhatsApp

Usa la **WhatsApp Cloud API** oficial de Meta.

1. Entra a [developers.facebook.com](https://developers.facebook.com), crea una
   app de tipo **Business** y agrégale el producto **WhatsApp**.
2. En *WhatsApp → Configuración de la API*:
   - Copia el **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID` en `wrangler.jsonc`.
   - Agrega tu celular como destinatario de prueba (el número de prueba de Meta
     solo puede escribir a hasta 5 números verificados).
   - Para producción, registra un número propio que no esté en la app de
     WhatsApp y crea un **token permanente** (usuario del sistema en Meta
     Business, permisos `whatsapp_business_messaging`). El token de prueba
     vence en 24 horas.
3. Carga los secretos:
   ```bash
   npx wrangler secret put WHATSAPP_TOKEN         # el token de acceso
   npx wrangler secret put WHATSAPP_APP_SECRET    # Configuración de la app → Básica → Clave secreta
   npx wrangler secret put WHATSAPP_VERIFY_TOKEN  # inventa un texto cualquiera
   ```
4. En *WhatsApp → Configuración → Webhook*:
   - URL: `https://luz-asistente.TU-CUENTA.workers.dev/whatsapp`
   - Token de verificación: el mismo `WHATSAPP_VERIFY_TOKEN`.
   - Suscríbete al campo **messages**.
5. Escríbele al número del bot. Te responde con tu id (`wa:591...`): agrégalo
   a `USUARIOS_PERMITIDOS` y vuelve a publicar.

**La regla de las 24 horas.** WhatsApp solo deja que el bot te escriba libremente
hasta 24 h después de tu último mensaje. Si usas el bot todos los días no lo
notas, pero un aviso de algo anotado hace una semana fallaría. Para eso:

1. En *WhatsApp Manager → Plantillas de mensajes*, crea una plantilla de
   categoría **Utilidad**, por ejemplo `recordatorio`, con el cuerpo:
   `Recordatorio: {{1}}`
2. Cuando Meta la apruebe, pon su nombre en `WHATSAPP_PLANTILLA` y publica.

Con plantilla, todos los avisos salen por ahí y llegan siempre. Meta cobra cada
mensaje de plantilla (centavos de dólar) y para eso pide una tarjeta en la
cuenta de WhatsApp Business. Contestar a tus mensajes sigue siendo gratis.

## 7. (Opcional) Usar Claude para entender mejor

```bash
npx wrangler secret put ANTHROPIC_API_KEY    # de console.anthropic.com
```

Con la clave cargada, el bot usa Claude (`CLAUDE_MODELO`, por defecto
`claude-opus-5-5`) para entender los mensajes; los audios siguen pasando por
Whisper. Si Claude rechaza un pedido, la API lo reintenta sola con otro modelo
(`fallbacks: "default"`). Se paga por uso: unos centavos de dólar por cada
mensaje. Para volver a lo gratis: `npx wrangler secret delete ANTHROPIC_API_KEY`.

---

## Desarrollo

```bash
npm test            # pruebas (fechas, IA simulada y el flujo completo con D1 local)
npm run typecheck
npx wrangler tail   # ver los logs del bot en vivo
```

| Archivo | Qué hace |
|---|---|
| `src/index.ts` | Rutas: webhooks de Telegram y WhatsApp, y el cron |
| `src/asistente.ts` | Atiende cada mensaje: comandos, guardar, completar, reprogramar |
| `src/cerebro.ts` | Instrucciones y llamada a la IA (Workers AI o Claude) |
| `src/recordatorios.ts` | Cada minuto: avisos previos, avisos a la hora, resumen diario |
| `src/voz.ts` | Audio → texto con Whisper |
| `src/fechas.ts` | Zona horaria, repeticiones y fechas en español |
| `src/db.ts` | Consultas a D1 |
| `schema.sql` | Tablas |
