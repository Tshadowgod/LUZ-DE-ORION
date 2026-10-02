import type { Repetir } from "./fechas";

export interface Tarea {
  id: number;
  chat: string;
  titulo: string;
  detalles: string | null;
  vence: number;
  aviso_min: number;
  repetir: Repetir;
  estado: "pendiente" | "hecha" | "cancelada";
  aviso_previo_enviado: number;
  aviso_enviado: number;
  creada: number;
}

export interface Borrador {
  titulo: string | null;
  detalles: string | null;
  fecha_hora: string | null;
  aviso_minutos_antes: number | null;
  repetir: Repetir;
}

export interface Turno {
  r: "u" | "a";
  t: string;
}

export interface Chat {
  chat: string;
  borrador: Borrador | null;
  historial: Turno[];
  ultimo_resumen: string | null;
}

const MAX_HISTORIAL = 12;

export async function leerChat(db: D1Database, chat: string): Promise<Chat> {
  const fila = await db
    .prepare("SELECT chat, borrador, historial, ultimo_resumen FROM chats WHERE chat = ?")
    .bind(chat)
    .first<{ chat: string; borrador: string | null; historial: string; ultimo_resumen: string | null }>();
  if (!fila) return { chat, borrador: null, historial: [], ultimo_resumen: null };
  return {
    chat,
    borrador: fila.borrador ? (JSON.parse(fila.borrador) as Borrador) : null,
    historial: JSON.parse(fila.historial) as Turno[],
    ultimo_resumen: fila.ultimo_resumen,
  };
}

export async function guardarChat(db: D1Database, c: Chat): Promise<void> {
  const historial = c.historial.slice(-MAX_HISTORIAL);
  await db
    .prepare(
      `INSERT INTO chats (chat, borrador, historial, ultimo_resumen, actualizado)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (chat) DO UPDATE SET
         borrador = ?2, historial = ?3, ultimo_resumen = ?4, actualizado = ?5`,
    )
    .bind(c.chat, c.borrador ? JSON.stringify(c.borrador) : null, JSON.stringify(historial), c.ultimo_resumen, Date.now())
    .run();
}

export async function listarChats(db: D1Database): Promise<Chat[]> {
  const { results } = await db
    .prepare("SELECT chat, ultimo_resumen FROM chats")
    .all<{ chat: string; ultimo_resumen: string | null }>();
  return results.map((f) => ({ chat: f.chat, borrador: null, historial: [], ultimo_resumen: f.ultimo_resumen }));
}

export async function marcarResumen(db: D1Database, chat: string, dia: string): Promise<void> {
  await db.prepare("UPDATE chats SET ultimo_resumen = ? WHERE chat = ?").bind(dia, chat).run();
}

export async function crearTarea(
  db: D1Database,
  t: Pick<Tarea, "chat" | "titulo" | "detalles" | "vence" | "aviso_min" | "repetir">,
): Promise<number> {
  const ahora = Date.now();
  // Si el aviso previo ya pasó, no tiene sentido mandarlo.
  const previoPasado = t.aviso_min > 0 && t.vence - t.aviso_min * 60_000 <= ahora ? 1 : 0;
  const r = await db
    .prepare(
      `INSERT INTO tareas (chat, titulo, detalles, vence, aviso_min, repetir, aviso_previo_enviado, creada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(t.chat, t.titulo, t.detalles, t.vence, t.aviso_min, t.repetir, previoPasado, ahora)
    .first<{ id: number }>();
  return r!.id;
}

export async function leerTarea(db: D1Database, chat: string, id: number): Promise<Tarea | null> {
  return db.prepare("SELECT * FROM tareas WHERE id = ? AND chat = ?").bind(id, chat).first<Tarea>();
}

export async function pendientes(db: D1Database, chat: string, limite = 30): Promise<Tarea[]> {
  const { results } = await db
    .prepare("SELECT * FROM tareas WHERE chat = ? AND estado = 'pendiente' ORDER BY vence LIMIT ?")
    .bind(chat, limite)
    .all<Tarea>();
  return results;
}

export async function cambiarEstado(db: D1Database, id: number, estado: Tarea["estado"]): Promise<void> {
  await db.prepare("UPDATE tareas SET estado = ? WHERE id = ?").bind(estado, id).run();
}

/** Mueve la tarea a otra hora y vuelve a armar los avisos. */
export async function reprogramar(db: D1Database, id: number, vence: number, conAvisoPrevio = true): Promise<void> {
  await db
    .prepare(
      `UPDATE tareas SET vence = ?1, aviso_enviado = 0,
         aviso_previo_enviado = CASE WHEN ?2 = 1 AND aviso_min > 0 AND ?1 - aviso_min * 60000 > ?3 THEN 0 ELSE 1 END
       WHERE id = ?4`,
    )
    .bind(vence, conAvisoPrevio ? 1 : 0, Date.now(), id)
    .run();
}

/** Tareas con algún aviso pendiente de mandar a esta hora. */
export async function porAvisar(db: D1Database, ahora: number): Promise<Tarea[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM tareas WHERE estado = 'pendiente' AND (
         (aviso_enviado = 0 AND vence <= ?1) OR
         (aviso_previo_enviado = 0 AND aviso_min > 0 AND vence - aviso_min * 60000 <= ?1)
       ) ORDER BY vence LIMIT 50`,
    )
    .bind(ahora)
    .all<Tarea>();
  return results;
}

export async function marcarAviso(db: D1Database, id: number, cual: "previo" | "final"): Promise<void> {
  const col = cual === "previo" ? "aviso_previo_enviado" : "aviso_enviado";
  await db.prepare(`UPDATE tareas SET ${col} = 1 WHERE id = ?`).bind(id).run();
}

export async function delDia(db: D1Database, chat: string, desde: number, hasta: number): Promise<Tarea[]> {
  const { results } = await db
    .prepare("SELECT * FROM tareas WHERE chat = ? AND estado = 'pendiente' AND vence >= ? AND vence < ? ORDER BY vence")
    .bind(chat, desde, hasta)
    .all<Tarea>();
  return results;
}
