import type { Env } from "./env";
import { atenderBoton, atenderMensaje, canalPara, MENSAJE_NO_AUTORIZADO, permitido } from "./asistente";
import * as telegram from "./canales/telegram";
import * as whatsapp from "./canales/whatsapp";
import { revisar } from "./recordatorios";
import { transcribir } from "./voz";

const ok = () => new Response("ok");

/** Atiende una entrada de cualquier canal y contesta por el mismo. */
async function procesar(
  env: Env,
  chat: string,
  entrada: { texto?: string; bajarAudio?: () => Promise<ArrayBuffer>; botonId?: string },
): Promise<void> {
  const { canal, destino } = canalPara(env, chat);
  if (!permitido(env, chat)) {
    await canal.enviar(destino, MENSAJE_NO_AUTORIZADO(chat));
    return;
  }
  try {
    if (entrada.botonId) {
      await canal.enviar(destino, await atenderBoton(env, chat, entrada.botonId));
      return;
    }
    let texto = entrada.texto ?? "";
    let prefijo = "";
    if (entrada.bajarAudio) {
      texto = await transcribir(env, await entrada.bajarAudio());
      if (!texto) {
        await canal.enviar(destino, "No pude entender el audio 🙉 ¿Me lo mandas de nuevo o por texto?");
        return;
      }
      prefijo = `🎙️ "${texto}"\n\n`;
    }
    if (!texto.trim()) return;
    await canal.enviar(destino, prefijo + (await atenderMensaje(env, chat, texto)));
  } catch (e) {
    console.error("procesar", chat, e);
    await canal.enviar(destino, "Uy, algo falló de mi lado 😕 Intenta de nuevo en un momento.").catch(() => {});
  }
}

async function webhookTelegram(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.TELEGRAM_SECRETO || req.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_SECRETO) {
    return new Response("no autorizado", { status: 401 });
  }
  const e = telegram.leerUpdate(await req.json());
  if (!e) return ok();
  const chat = `tg:${e.chatId}`;
  if (e.boton) {
    ctx.waitUntil(telegram.contestarBoton(env, e.boton.callbackId).catch(() => {}));
  }
  ctx.waitUntil(
    procesar(env, chat, {
      texto: e.texto,
      botonId: e.boton?.id,
      bajarAudio: e.audioId ? () => telegram.descargarAudio(env, e.audioId!) : undefined,
    }),
  );
  return ok();
}

async function webhookWhatsapp(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cuerpo = await req.text();
  if (!(await whatsapp.firmaValida(env, cuerpo, req.headers.get("x-hub-signature-256")))) {
    return new Response("firma inválida", { status: 401 });
  }
  for (const e of whatsapp.leerWebhook(JSON.parse(cuerpo))) {
    ctx.waitUntil(
      procesar(env, `wa:${e.numero}`, {
        texto: e.texto,
        botonId: e.botonId,
        bajarAudio: e.audioId ? () => whatsapp.descargarAudio(env, e.audioId!) : undefined,
      }),
    );
  }
  return ok();
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/telegram" && req.method === "POST") return webhookTelegram(req, env, ctx);

    // Una sola vez, después de publicar: conecta el bot de Telegram con este Worker.
    if (url.pathname === "/telegram/configurar") {
      if (!env.TELEGRAM_SECRETO || url.searchParams.get("secreto") !== env.TELEGRAM_SECRETO) {
        return new Response("Falta ?secreto=<TELEGRAM_SECRETO>", { status: 401 });
      }
      const r = await telegram.configurarWebhook(env, `${url.origin}/telegram`);
      return Response.json({ listo: true, telegram: r });
    }

    // Meta verifica el webhook con un GET antes de empezar a mandar mensajes.
    if (url.pathname === "/whatsapp" && req.method === "GET") {
      const q = url.searchParams;
      if (q.get("hub.mode") === "subscribe" && env.WHATSAPP_VERIFY_TOKEN && q.get("hub.verify_token") === env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(q.get("hub.challenge") ?? "");
      }
      return new Response("no autorizado", { status: 403 });
    }
    if (url.pathname === "/whatsapp" && req.method === "POST") return webhookWhatsapp(req, env, ctx);

    return new Response("Asistente funcionando ✨");
  },

  async scheduled(_evento: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(revisar(env));
  },
} satisfies ExportedHandler<Env>;
