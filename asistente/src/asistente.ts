// Lo que pasa cuando llega un mensaje: entender, guardar y contestar.

import type { Env } from "./env";
import type { Boton, Canal } from "./canales/tipos";
import { canalTelegram } from "./canales/telegram";
import { canalWhatsapp } from "./canales/whatsapp";
import { pensar, type Decision } from "./cerebro";
import * as db from "./db";
import { describirCorto, diaLocal, localAUtc, siguiente } from "./fechas";

export function canalPara(env: Env, chat: string): { canal: Canal; destino: string } {
  if (chat.startsWith("wa:")) return { canal: canalWhatsapp(env), destino: chat.slice(3) };
  return { canal: canalTelegram(env), destino: chat.slice(3) };
}

export function permitido(env: Env, chat: string): boolean {
  return (env.USUARIOS_PERMITIDOS ?? "")
    .split(",")
    .map((s) => s.trim())
    .includes(chat);
}

export function botonesTarea(id: number): Boton[] {
  return [
    { id: `hecho:${id}`, titulo: "✅ Hecho" },
    { id: `mas10:${id}`, titulo: "⏰ +10 min" },
    { id: `mas60:${id}`, titulo: "⏰ +1 hora" },
  ];
}

const AYUDA = `Hola, soy tu asistente 👋

Cuéntame por texto o por audio lo que tienes que hacer y te lo recuerdo. Por ejemplo:
• "Mañana a las 10 tengo dentista"
• "Recuérdame pagar la luz el viernes"
• "Todos los lunes a las 8 sacar la basura"
• "En 20 minutos sacar la ropa"

Si falta algo te pregunto (hora, lugar, qué llevar, cuánto antes avisarte).

También puedes decirme:
• "¿Qué tengo hoy?" o /hoy
• "¿Qué tengo pendiente?" o /lista
• "Ya fui al dentista" → la marco como hecha
• "Pasa lo del dentista al jueves a las 4"
• "Cancela lo de la luz"`;

function linea(t: db.Tarea, tz: string): string {
  const rep = t.repetir !== "no" ? ` 🔁 ${t.repetir}` : "";
  const vencida = t.vence < Date.now() ? " ⚠️" : "";
  return `• ${describirCorto(t.vence, tz)} — ${t.titulo}${rep}${vencida}`;
}

export function formatearLista(tareas: db.Tarea[], tz: string, vacio = "No tienes nada pendiente 🎉"): string {
  if (!tareas.length) return vacio;
  return tareas.map((t) => linea(t, tz)).join("\n");
}

async function tareasDeHoy(env: Env, chat: string): Promise<db.Tarea[]> {
  const tz = env.ZONA_HORARIA;
  const hoy = diaLocal(Date.now(), tz);
  const desde = localAUtc(`${hoy}T00:00`, tz)!;
  const hasta = localAUtc(`${diaLocal(desde + 36 * 3_600_000, tz)}T00:00`, tz)!;
  return db.delDia(env.DB, chat, desde, hasta);
}

function confirmacion(t: { titulo: string; detalles: string | null; vence: number; aviso_min: number; repetir: string }, tz: string): string {
  const partes = [`✅ Anotado: ${t.titulo}`, `🗓️ ${describirCorto(t.vence, tz)}`];
  if (t.repetir !== "no") partes.push(`🔁 Se repite: ${t.repetir}`);
  if (t.detalles) partes.push(`📝 ${t.detalles}`);
  partes.push(t.aviso_min > 0 ? `🔔 Te aviso ${t.aviso_min} min antes y a la hora.` : "🔔 Te aviso a la hora.");
  return partes.join("\n");
}

/** Ejecuta lo que decidió la IA y arma el texto a contestar. */
async function aplicar(env: Env, chat: db.Chat, d: Decision): Promise<string> {
  const tz = env.ZONA_HORARIA;

  switch (d.accion) {
    case "guardar": {
      const b = d.borrador ?? chat.borrador;
      const vence = b?.fecha_hora ? localAUtc(b.fecha_hora, tz) : null;
      if (!b?.titulo || vence === null) {
        chat.borrador = b;
        return d.respuesta || "¿Para qué día y a qué hora lo anoto?";
      }
      if (vence < Date.now() - 60_000) {
        chat.borrador = b;
        return `Esa hora ya pasó (${describirCorto(vence, tz)}). ¿Para cuándo lo dejo?`;
      }
      const aviso = b.aviso_minutos_antes ?? Number(env.AVISO_PREVIO_MIN || 0);
      const tarea = { chat: chat.chat, titulo: b.titulo, detalles: b.detalles, vence, aviso_min: Math.max(0, aviso), repetir: b.repetir };
      await db.crearTarea(env.DB, tarea);
      chat.borrador = null;
      return confirmacion(tarea, tz);
    }

    case "completar":
    case "cancelar":
    case "reprogramar": {
      chat.borrador = d.borrador ?? chat.borrador;
      const t = d.tarea_id !== null ? await db.leerTarea(env.DB, chat.chat, d.tarea_id) : null;
      if (!t || t.estado !== "pendiente") return d.respuesta || "No encontré esa tarea. ¿Me dices cuál es?";

      if (d.accion === "cancelar") {
        await db.cambiarEstado(env.DB, t.id, "cancelada");
        return `🗑️ Cancelado: ${t.titulo}${t.repetir !== "no" ? " (y sus repeticiones)" : ""}`;
      }
      if (d.accion === "completar") {
        if (t.repetir !== "no") {
          // Si la de hoy todavía no sonó, la salteamos; si ya sonó, la serie ya avanzó sola.
          const ahora = Date.now();
          let proxima = t.vence;
          if (t.vence > ahora && diaLocal(t.vence, tz) === diaLocal(ahora, tz)) {
            proxima = siguiente(t.vence, t.repetir, tz)!;
            await db.reprogramar(env.DB, t.id, proxima);
          }
          return `✅ ¡Bien! ${t.titulo} hecho. La próxima vez es ${describirCorto(proxima, tz)}.`;
        }
        await db.cambiarEstado(env.DB, t.id, "hecha");
        return `✅ ¡Bien! Marqué como hecho: ${t.titulo}`;
      }
      const nueva = d.nueva_fecha_hora ? localAUtc(d.nueva_fecha_hora, tz) : null;
      if (nueva === null) return d.respuesta || `¿Para qué día y hora muevo "${t.titulo}"?`;
      if (nueva < Date.now() - 60_000) return `Esa hora ya pasó (${describirCorto(nueva, tz)}). ¿Para cuándo lo muevo?`;
      await db.reprogramar(env.DB, t.id, nueva);
      return `🔄 Movido: ${t.titulo}\n🗓️ ${describirCorto(nueva, tz)}`;
    }

    case "listar": {
      chat.borrador = d.borrador ?? chat.borrador;
      const lista = formatearLista(await db.pendientes(env.DB, chat.chat), tz);
      return d.respuesta ? `${d.respuesta}\n\n${lista}` : lista;
    }

    default:
      chat.borrador = d.borrador;
      return d.respuesta || "No te entendí bien. ¿Me lo repites?";
  }
}

/** Mensaje de texto (o audio ya transcrito). Devuelve el texto a contestar. */
export async function atenderMensaje(env: Env, chatId: string, texto: string): Promise<string> {
  const comando = texto.trim().toLowerCase().split(/[\s@]/)[0];
  if (comando === "/start" || comando === "/ayuda" || comando === "/help") return AYUDA;
  if (comando === "/lista") return formatearLista(await db.pendientes(env.DB, chatId), env.ZONA_HORARIA);
  if (comando === "/hoy")
    return formatearLista(await tareasDeHoy(env, chatId), env.ZONA_HORARIA, "Hoy no tienes nada anotado 🙌");

  const chat = await db.leerChat(env.DB, chatId);
  const tareas = await db.pendientes(env.DB, chatId);
  const decision = await pensar(env, texto, chat.borrador, tareas, chat.historial);
  const respuesta = await aplicar(env, chat, decision);

  chat.historial.push({ r: "u", t: texto }, { r: "a", t: respuesta });
  await db.guardarChat(env.DB, chat);
  return respuesta;
}

/** Botones de los avisos: hecho, +10 min, +1 hora. */
export async function atenderBoton(env: Env, chatId: string, botonId: string): Promise<string> {
  const [accion, idTexto] = botonId.split(":");
  const t = await db.leerTarea(env.DB, chatId, Number(idTexto));
  if (!t) return "Esa tarea ya no existe.";
  if (t.estado !== "pendiente") return `"${t.titulo}" ya estaba ${t.estado}.`;
  const tz = env.ZONA_HORARIA;

  if (accion === "hecho") {
    // Las que se repiten ya quedaron programadas para la próxima vez.
    if (t.repetir !== "no") return `✅ ¡Bien! La próxima: ${describirCorto(t.vence, tz)}.`;
    await db.cambiarEstado(env.DB, t.id, "hecha");
    return `✅ ¡Bien! Marqué como hecho: ${t.titulo}`;
  }
  if (accion === "mas10" || accion === "mas60") {
    const min = accion === "mas10" ? 10 : 60;
    if (t.repetir !== "no") {
      // No movemos la serie: creamos un recordatorio suelto.
      const vence = Date.now() + min * 60_000;
      const id = await db.crearTarea(env.DB, { chat: chatId, titulo: t.titulo, detalles: t.detalles, vence, aviso_min: 0, repetir: "no" });
      return `⏰ Te lo vuelvo a recordar ${describirCorto(vence, tz)} (#${id}).`;
    }
    const vence = Date.now() + min * 60_000;
    await db.reprogramar(env.DB, t.id, vence, false);
    return `⏰ Te lo vuelvo a recordar ${describirCorto(vence, tz)}.`;
  }
  return "No entendí ese botón.";
}

export const MENSAJE_NO_AUTORIZADO = (chat: string) =>
  `Hola 👋 Todavía no estás autorizado para usar este asistente.\n\nTu id es: ${chat}\n\nAgrégalo en USUARIOS_PERMITIDOS (asistente/wrangler.jsonc) y vuelve a publicar con "npm run deploy".`;
