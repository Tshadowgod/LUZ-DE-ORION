// Lo que corre cada minuto: avisos previos, avisos a la hora y resumen del día.

import type { Env } from "./env";
import { botonesTarea, canalPara, formatearLista } from "./asistente";
import * as db from "./db";
import { diaLocal, horaLocal, localAUtc, minutosDelDia, siguiente } from "./fechas";

// Si falla el envío, se reintenta cada minuto durante este tiempo.
const REINTENTAR_MS = 15 * 60_000;

async function avisarTarea(env: Env, t: db.Tarea, ahora: number): Promise<void> {
  const { canal, destino } = canalPara(env, t.chat);
  const tz = env.ZONA_HORARIA;

  if (!t.aviso_enviado && t.vence <= ahora) {
    const texto = `⏰ Es hora: ${t.titulo}${t.detalles ? `\n📝 ${t.detalles}` : ""}`;
    try {
      await canal.avisar(destino, texto, botonesTarea(t.id));
    } catch (e) {
      console.error("aviso", t.id, e);
      if (ahora - t.vence < REINTENTAR_MS) return;
    }
    let proxima = siguiente(t.vence, t.repetir, tz);
    while (proxima !== null && proxima <= ahora) proxima = siguiente(proxima, t.repetir, tz);
    if (proxima !== null) await db.reprogramar(env.DB, t.id, proxima);
    else {
      await db.marcarAviso(env.DB, t.id, "final");
      await db.marcarAviso(env.DB, t.id, "previo");
    }
    return;
  }

  if (!t.aviso_previo_enviado) {
    const faltan = Math.max(1, Math.round((t.vence - ahora) / 60_000));
    const texto = `🔔 En ${faltan} min (${horaLocal(t.vence, tz)}): ${t.titulo}${t.detalles ? `\n📝 ${t.detalles}` : ""}`;
    try {
      await canal.avisar(destino, texto);
    } catch (e) {
      console.error("aviso previo", t.id, e);
      return;
    }
    await db.marcarAviso(env.DB, t.id, "previo");
  }
}

async function resumenDiario(env: Env, ahora: number): Promise<void> {
  const hora = minutosDelDia(env.HORA_RESUMEN ?? "");
  if (hora === null) return;
  const tz = env.ZONA_HORARIA;
  const [h, m] = horaLocal(ahora, tz).split(":").map(Number);
  const minutos = h * 60 + m;
  if (minutos < hora) return;

  const hoy = diaLocal(ahora, tz);
  const desde = localAUtc(`${hoy}T00:00`, tz)!;
  const hasta = localAUtc(`${diaLocal(desde + 36 * 3_600_000, tz)}T00:00`, tz)!;
  // Si el Worker estuvo apagado a la hora del resumen, no lo mandamos tarde de noche.
  const aTiempo = minutos - hora <= 180;

  for (const chat of await db.listarChats(env.DB)) {
    if (chat.ultimo_resumen === hoy) continue;
    const tareas = await db.delDia(env.DB, chat.chat, desde, hasta);
    if (aTiempo && tareas.length) {
      const { canal, destino } = canalPara(env, chat.chat);
      try {
        await canal.avisar(destino, `☀️ Buenos días. Hoy tienes:\n${formatearLista(tareas, tz)}`);
      } catch (e) {
        console.error("resumen", chat.chat, e);
        continue;
      }
    }
    await db.marcarResumen(env.DB, chat.chat, hoy);
  }
}

export async function revisar(env: Env, ahora = Date.now()): Promise<void> {
  for (const t of await db.porAvisar(env.DB, ahora)) {
    try {
      await avisarTarea(env, t, ahora);
    } catch (e) {
      console.error("tarea", t.id, e);
    }
  }
  try {
    await resumenDiario(env, ahora);
  } catch (e) {
    console.error("resumen diario", e);
  }
}
