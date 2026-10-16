// WhatsApp Cloud API de Meta (opcional).
//
// Ojo: WhatsApp solo deja mandar mensajes libres dentro de las 24 h siguientes
// al último mensaje del usuario. Para avisos fuera de esa ventana hace falta
// una plantilla aprobada (WHATSAPP_PLANTILLA) con un parámetro {{1}}.

import type { Env } from "../env";
import type { Boton, Canal } from "./tipos";

export interface EntradaWhatsapp {
  numero: string;
  texto?: string;
  audioId?: string;
  botonId?: string;
}

function graph(env: Env, ruta: string): string {
  return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION || "v23.0"}/${ruta}`;
}

async function mandar(env: Env, cuerpo: Record<string, unknown>): Promise<void> {
  const r = await fetch(graph(env, `${env.WHATSAPP_PHONE_NUMBER_ID}/messages`), {
    method: "POST",
    headers: { authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...cuerpo }),
  });
  if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${await r.text()}`);
}

function mensajeLibre(destino: string, texto: string, botones?: Boton[]): Record<string, unknown> {
  if (!botones?.length) return { to: destino, type: "text", text: { body: texto } };
  return {
    to: destino,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: texto.slice(0, 1024) },
      action: {
        // WhatsApp: máximo 3 botones de hasta 20 caracteres.
        buttons: botones.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.titulo.slice(0, 20) } })),
      },
    },
  };
}

export function canalWhatsapp(env: Env): Canal {
  return {
    enviar: (destino, texto, botones) => mandar(env, mensajeLibre(destino, texto, botones)),
    async avisar(destino, texto, botones) {
      if (!env.WHATSAPP_PLANTILLA) return mandar(env, mensajeLibre(destino, texto, botones));
      await mandar(env, {
        to: destino,
        type: "template",
        template: {
          name: env.WHATSAPP_PLANTILLA,
          language: { code: env.WHATSAPP_PLANTILLA_IDIOMA || "es" },
          components: [
            // Las plantillas no aceptan saltos de línea en los parámetros.
            { type: "body", parameters: [{ type: "text", text: texto.replace(/\s*\n+\s*/g, " · ") }] },
          ],
        },
      });
    },
  };
}

/** Verifica que el webhook venga de Meta (firma HMAC con el App Secret). */
export async function firmaValida(env: Env, cuerpo: string, firma: string | null): Promise<boolean> {
  if (!env.WHATSAPP_APP_SECRET || !firma?.startsWith("sha256=")) return false;
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.WHATSAPP_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo)));
  const esperado = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  const recibido = firma.slice("sha256=".length);
  if (recibido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ recibido.charCodeAt(i);
  return dif === 0;
}

export function leerWebhook(cuerpo: Record<string, any>): EntradaWhatsapp[] {
  const salida: EntradaWhatsapp[] = [];
  for (const entry of cuerpo.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const numero = String(m.from);
        if (m.type === "text") salida.push({ numero, texto: m.text?.body ?? "" });
        else if (m.type === "audio" && m.audio?.id) salida.push({ numero, audioId: m.audio.id });
        else if (m.type === "interactive" && m.interactive?.button_reply?.id)
          salida.push({ numero, botonId: m.interactive.button_reply.id });
        else if (m.type === "button" && m.button?.payload) salida.push({ numero, botonId: m.button.payload });
      }
    }
  }
  return salida;
}

export async function descargarAudio(env: Env, mediaId: string): Promise<ArrayBuffer> {
  const auth = { authorization: `Bearer ${env.WHATSAPP_TOKEN}` };
  const meta = await fetch(graph(env, mediaId), { headers: auth });
  if (!meta.ok) throw new Error(`WhatsApp media ${meta.status}`);
  const { url } = (await meta.json()) as { url: string };
  const r = await fetch(url, { headers: auth });
  if (!r.ok) throw new Error(`No se pudo bajar el audio (${r.status})`);
  return r.arrayBuffer();
}
