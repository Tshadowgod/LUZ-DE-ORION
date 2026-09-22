# Guía: tienda Next.js en Cloudflare (sin tarjeta)

Receta para armar un proyecto como Luz de Orión directo en Cloudflare:
Next.js en Workers, fotos en Workers KV, base en Neon y dominio propio.
Todo entra en planes gratuitos que no piden tarjeta.

Los archivos citados existen en este repo: copialos al proyecto nuevo.

---

## 0. Por qué esta arquitectura

Luz de Orión estaba en Vercel y las fotos en Vercel Blob. Cada visita bajaba
las fotos originales (~1,5 MB cada una). En un mes se consumieron 10,16 GB de
tráfico contra 10 GB del plan gratis y **suspendieron el almacén**: la tienda
quedó sin imágenes y hubo que pagar un mes de Pro solo para rescatarlas.

Esta receta evita eso de raíz:

- Las fotos se **comprimen en el navegador** antes de subir (2,8 MB → ~220 KB).
- Se sirven con **caché de un año** en el CDN de Cloudflare.
- **KV no cobra tráfico**. El límite que rompió la tienda no existe acá.

| Pieza | Servicio | Gratis | Tarjeta |
|---|---|---|---|
| App | Cloudflare Workers | 100.000 pedidos/día | No |
| Fotos | Workers KV | 1 GB (~8.500 fotos) | No |
| Base | Neon | ~0,5 GB | No |
| Dominio | Namecheap / Cloudflare | ~1-15 USD/año | Sí (compra) |

Si algún día pasás de 1 GB de fotos: R2 da 10 GB gratis pero pide tarjeta.

---

## 1. Instalar

```bash
npm install next@latest              # 16.3.3 o más: el adaptador no soporta 16.0-16.3.2
npm install -D @opennextjs/cloudflare wrangler
npx wrangler login                   # abre el navegador, una sola vez
```

## 2. Archivos de configuración

**`open-next.config.ts`**
```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
export default defineCloudflareConfig();
```

**`wrangler.jsonc`** (ver el de este repo)
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mi-tienda",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-09-20",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": false,
  "routes": [
    { "pattern": "midominio.com", "custom_domain": true },
    { "pattern": "www.midominio.com", "custom_domain": true }
  ],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "kv_namespaces": [{ "binding": "FOTOS", "id": "PONER_EL_ID" }],
  "observability": { "enabled": true }
}
```

- `nodejs_compat`: lo necesitan el driver de Neon y el adaptador.
- `workers_dev: false`: una cuenta nueva no tiene subdominio workers.dev y
  sin esto el deploy falla. Con dominio propio no hace falta.

**`next.config.ts`**
```ts
import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    // El optimizador de Next es gratis en Vercel pero pago en Cloudflare.
    // No hace falta: las fotos ya llegan comprimidas.
    unoptimized: true,
  },
};

export default nextConfig;
initOpenNextCloudflareForDev();
```

**`package.json`**
```json
"cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"cf:deploy":  "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

**`.gitignore`**
```
.open-next/
.dev.vars
.wrangler/
worker-configuration.d.ts
.env*
!.env.production
```

**`tsconfig.json`**: agregar `"worker-configuration.d.ts"` a `exclude`. Esos
tipos son del runtime de Workers, pisan los del navegador y hacen que
`res.json()` devuelva `unknown` en los componentes del cliente.

---

## 3. Fotos en KV

```bash
npx wrangler kv namespace create FOTOS
# copiar el id que imprime a wrangler.jsonc
```

Tres archivos, copiarlos de este repo:

| Archivo | Qué hace |
|---|---|
| `src/lib/comprimir-imagen.ts` | Comprime en el navegador a WebP 1400px, respeta la orientación EXIF |
| `src/lib/fotos.ts` | `guardarFoto()` y `leerFoto()` sobre el binding `FOTOS` |
| `src/app/fotos/[...ruta]/route.ts` | Sirve la foto con caché de un año |
| `src/app/api/upload/route.ts` | Recibe el archivo ya comprimido y lo guarda |

En los formularios, antes de subir:
```ts
const { archivo } = await comprimirImagen(file);
fd.append('file', archivo);
```

En la base se guarda la ruta **relativa**: `/fotos/productos/123-anillo.webp`.
Así sigue funcionando si cambiás de dominio.

> `sharp` no funciona en Workers (es un binario nativo). Por eso la
> compresión va en el navegador. Para scripts locales en Node sí se puede usar.

---

## 4. Variables

| Tipo | Ejemplo | Dónde va |
|---|---|---|
| Secretas | `ADMIN_PASSWORD`, `JWT_SECRET` | `npx wrangler secret put NOMBRE` |
| Públicas | `NEXT_PUBLIC_WHATSAPP_PHONE` | `.env.production`, **versionado** |
| Locales | `DATABASE_URL` | `.env.local` y `.dev.vars` |

- Las `NEXT_PUBLIC_` se incrustan en el JavaScript al construir: no son secretas
  y no sirven como secreto de Cloudflare.
- Los secretos de Cloudflare **no se pueden leer después**. Anotá la contraseña
  del panel en un lugar seguro.
- `JWT_SECRET` se puede generar así, sin verlo:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))" \
    | npx wrangler secret put JWT_SECRET
  ```

---

## 5. Dominio

1. Comprar el dominio. Ojo con `.store`, `.online`, etc.: el primer año sale
   ~1 USD y la renovación bastante más. Un `.com` se mantiene en ~10-12 USD.
2. Namecheap: confirmar el correo de verificación (ICANN). Si no se hace en 15
   días, suspenden el dominio.
3. Cloudflare → **Connect a domain** → plan **Free** → anotar los 2 nameservers.
4. Namecheap → Domain List → Manage → **Nameservers** → Custom DNS → pegar los
   dos → **tocar el ✓ verde** (si no, no guarda).
5. Cloudflare → DNS → **borrar el `A` y el `CNAME www` de estacionamiento** que
   importa de Namecheap. Dejar los `MX` y el `TXT` (son del correo). Si no se
   borran, falla con `already has externally managed DNS records`.
6. Desplegar: `npm run cf:deploy`.

Si el dominio no carga en tu compu pero sí con datos móviles, es caché de DNS
del router. En Linux: `resolvectl flush-caches`.

---

## 6. Seguridad

- **Nunca** un valor de respaldo para el secreto de firma:
  ```ts
  // MAL: si falta la variable, cualquiera puede firmar una cookie de admin
  process.env.JWT_SECRET ?? 'algun-valor-por-defecto'
  ```
  Si falta, que falle cerrado (ver `src/lib/auth.ts` y `src/proxy.ts`).
- El panel vive en `/admin`: si no hay sesión, `src/proxy.ts` muestra el
  formulario con un *rewrite* (la dirección no cambia).
- Revisar antes de publicar:
  ```bash
  npx wrangler secret list
  ```

---

## 7. Modo mantenimiento

`src/proxy.ts` + `src/app/mantenimiento/page.tsx`. Apagado por defecto.
Se prende con `MANTENIMIENTO=1` y redeploy.

Deben quedar fuera del aviso: `/admin`, `/login`, `/api`, `/fotos` y
`/mantenimiento`. Si `/fotos` no está, las imágenes devuelven el HTML del aviso.

---

## 8. Probar y publicar

```bash
npx opennextjs-cloudflare build
npx wrangler dev                  # prueba local con KV simulado (lee .dev.vars)
npx wrangler deploy --dry-run     # revisa config y bindings sin publicar
npm run cf:deploy                 # publica
```

---

## 9. Si migrás fotos de otro lado

`scripts/migrar-fotos-a-kv.mjs`: descarga, comprime con sharp, sube a KV y
actualiza la base. Tiene `--dry` y se puede cortar y retomar.

Sube con `wrangler kv bulk put` en lotes de 20: un proceso por foto tardaba
~40 minutos para 179 fotos; en lotes, 90 segundos.

Si el origen es Vercel Blob y está suspendido, `vercel blob list` funciona pero
ninguna descarga: hay que reactivar el almacén (en Luz de Orión, un mes de Pro).

---

## Checklist

- [ ] Next ≥ 16.3.3, `@opennextjs/cloudflare`, `wrangler`
- [ ] `open-next.config.ts`, `wrangler.jsonc`, `next.config.ts`
- [ ] `.gitignore` y `tsconfig` excluyen `worker-configuration.d.ts`
- [ ] Namespace KV creado y su id en `wrangler.jsonc`
- [ ] Compresión en el navegador en todos los formularios con fotos
- [ ] Secretos: `ADMIN_PASSWORD`, `JWT_SECRET`
- [ ] Públicas en `.env.production`
- [ ] Sin valores de respaldo para secretos en el código
- [ ] Dominio: nameservers, registros de estacionamiento borrados
- [ ] `wrangler secret list` antes del primer deploy
- [ ] Probar en el celular con datos móviles
