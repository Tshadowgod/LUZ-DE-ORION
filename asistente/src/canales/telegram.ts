// Bot de Telegram: gratis, sin límites prácticos y acepta notas de voz.

import type { Env } from "../env";
import type { Boton, Canal } from "./tipos";

export interface EntradaTelegram {
  chatId: string;
  texto?: string;
  audioId?: string;
  boton?: { id: string; callbackId: string };
}

async function api<T = unknown>(env: Env, metodo: string, cuerpo: unknown): Promise<T> {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${metodo}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const j = (await r.json()) as { ok: boolean; result: T; description?: string };
  if (!j.ok) throw new Error(`Telegram ${metodo}: ${j.description}`);
  return j.result;
}

export function canalTelegram(env: Env): Canal {
  const enviar = async (destino: string, texto: string, botones?: Boton[]) => {
    await api(env, "sendMessage", {
      chat_id: destino,
      text: texto,
      ...(botones?.length
        ? { reply_markup: { inline_keyboard: [botones.map((b) => ({ text: b.titulo, callback_data: b.id }))] } }
        : {}),
    });
  };
  return { enviar, avisar: enviar };
}

/** Lee el update de Telegram. null si no es algo que nos interese. */
export function leerUpdate(update: Record<string, any>): EntradaTelegram | null {
  if (update.callback_query) {
    const q = update.callback_query;
    if (!q.message?.chat?.id || !q.data) return null;
    return { chatId: String(q.message.chat.id), boton: { id: q.data, callbackId: q.id } };
  }
  const m = update.message;
  if (!m?.chat?.id) return null;
  const chatId = String(m.chat.id);
  if (m.voice?.file_id) return { chatId, audioId: m.voice.file_id };
  if (m.audio?.file_id) return { chatId, audioId: m.audio.file_id };
  if (typeof m.text === "string") return { chatId, texto: m.text };
  return null;
}

export async function descargarAudio(env: Env, fileId: string): Promise<ArrayBuffer> {
  const f = await api<{ file_path: string }>(env, "getFile", { file_id: fileId });
  const r = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${f.file_path}`);
  if (!r.ok) throw new Error(`No se pudo bajar el audio (${r.status})`);
  return r.arrayBuffer();
}

export async function contestarBoton(env: Env, callbackId: string, texto?: string): Promise<void> {
  await api(env, "answerCallbackQuery", { callback_query_id: callbackId, ...(texto ? { text: texto } : {}) });
}

/** Conecta el bot con este Worker. Se llama una vez desde /telegram/configurar. */
export async function configurarWebhook(env: Env, url: string): Promise<unknown> {
  await api(env, "setMyCommands", {
    commands: [
      { command: "lista", description: "Ver lo pendiente" },
      { command: "hoy", description: "Lo que tengo hoy" },
      { command: "ayuda", description: "Cómo usarme" },
    ],
  });
  return api(env, "setWebhook", {
    url,
    secret_token: env.TELEGRAM_SECRETO,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}
