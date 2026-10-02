// La parte que "entiende": recibe el mensaje y el contexto, devuelve qué hacer.
// Usa Workers AI (gratis) o Claude si hay ANTHROPIC_API_KEY.

import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "./env";
import type { Borrador, Tarea, Turno } from "./db";
import { calendarioProximo, describirCorto, describirLargo } from "./fechas";

export type Accion = "ninguna" | "guardar" | "completar" | "cancelar" | "reprogramar" | "listar";

export interface Decision {
  respuesta: string;
  accion: Accion;
  borrador: Borrador | null;
  tarea_id: number | null;
  nueva_fecha_hora: string | null;
}

const MODELO_WORKERS_AI = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const nulo = (tipo: Record<string, unknown>) => ({ anyOf: [tipo, { type: "null" }] });

export const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["respuesta", "accion", "borrador", "tarea_id", "nueva_fecha_hora"],
  properties: {
    respuesta: { type: "string" },
    accion: { type: "string", enum: ["ninguna", "guardar", "completar", "cancelar", "reprogramar", "listar"] },
    borrador: nulo({
      type: "object",
      additionalProperties: false,
      required: ["titulo", "detalles", "fecha_hora", "aviso_minutos_antes", "repetir"],
      properties: {
        titulo: nulo({ type: "string" }),
        detalles: nulo({ type: "string" }),
        fecha_hora: nulo({ type: "string" }),
        aviso_minutos_antes: nulo({ type: "integer" }),
        repetir: { type: "string", enum: ["no", "diario", "semanal", "mensual"] },
      },
    }),
    tarea_id: nulo({ type: "integer" }),
    nueva_fecha_hora: nulo({ type: "string" }),
  },
} as const;

export const INSTRUCCIONES = `Eres un asistente personal que anota actividades y recordatorios. Hablas en español, con calidez y en mensajes cortos (es un chat de celular). Usas "tú".

Tu trabajo en cada mensaje es devolver un JSON con:
- "respuesta": lo que le dices al usuario.
- "accion": qué hay que hacer.
- "borrador": la actividad que se está armando (o null si no hay ninguna).
- "tarea_id" y "nueva_fecha_hora": solo para completar, cancelar o reprogramar.

CÓMO ARMAR UNA ACTIVIDAD
1. Cuando el usuario cuenta algo que tiene que hacer, llena el borrador con lo que ya sabes. Conserva lo que ya estaba en el BORRADOR ACTUAL y suma lo nuevo.
2. "titulo": corto y claro ("Dentista", "Pagar la luz", "Llamar a mamá").
3. "detalles": todo lo demás que sea útil (lugar, con quién, qué llevar, dirección, monto...). Junta la información de todos los mensajes.
4. "fecha_hora": SIEMPRE en formato "AAAA-MM-DDTHH:MM", hora local de 24 h. Usa el CALENDARIO para resolver "mañana", "el jueves", "pasado mañana". "En 20 minutos" = AHORA + 20 min. Si dice "a las 3" sin aclarar y es de día, entiende 15:00 salvo que el contexto indique la mañana.
5. "aviso_minutos_antes": cuántos minutos antes quiere un aviso extra (0 = solo a la hora). null si no lo dijo.
6. "repetir": "diario", "semanal" o "mensual" si es algo que se repite ("todos los lunes" = semanal); si no, "no".

CUÁNDO PREGUNTAR Y CUÁNDO GUARDAR
- Si falta la fecha o la hora, accion = "ninguna" y pregunta por eso.
- La primera vez que tienes título, fecha y hora, accion = "ninguna": muestra un resumen de una línea y haz UNA sola pregunta corta que junte lo que falte y sirva para esa actividad (por ejemplo: dónde es, con quién, si tiene que llevar o preparar algo, y cuánto antes quiere el aviso). Nada de interrogatorios: máximo 3 cosas en la misma pregunta.
- Cuando el usuario contesta esa pregunta, dice "así está bien", "no", "nada más", "listo", "dale", o ya había dado todos los detalles desde el principio, accion = "guardar" con el borrador completo.
- Si el usuario dice explícitamente "solo recuérdame..." o es algo muy simple ("en 10 minutos sacar la ropa"), guarda directo sin preguntar.
- Nunca inventes datos que el usuario no dio.

OTRAS ACCIONES (usa las TAREAS PENDIENTES para saber el id)
- "listar": quiere ver lo que tiene pendiente, lo de hoy, lo de la semana. "respuesta" puede ser una frase breve; la lista la agrega el sistema.
- "completar": dice que ya hizo algo. Pon su "tarea_id".
- "cancelar": quiere borrar o cancelar algo. Pon su "tarea_id".
- "reprogramar": quiere cambiar la fecha u hora de algo ya guardado. Pon "tarea_id" y "nueva_fecha_hora" (mismo formato).
- Si no está claro a cuál tarea se refiere, accion = "ninguna" y pregunta.
- Al completar, cancelar o reprogramar, deja el borrador como estaba (o null si no había).
- Si el usuario abandona la actividad que se estaba armando ("olvídalo", "no, nada"), borrador = null y accion = "ninguna".

Para saludos o charla, responde breve y recuerda que puede mandarte texto o audio con lo que tiene que hacer.`;

function contexto(
  env: Env,
  mensaje: string,
  borrador: Borrador | null,
  tareas: Tarea[],
  historial: Turno[],
): string {
  const ahora = Date.now();
  const tz = env.ZONA_HORARIA;
  const lista = tareas.length
    ? tareas
        .map((t) => `#${t.id} · ${describirCorto(t.vence, tz, ahora)} · ${t.titulo}${t.repetir !== "no" ? ` (se repite ${t.repetir})` : ""}`)
        .join("\n")
    : "(ninguna)";
  const charla = historial.length
    ? historial.map((h) => `${h.r === "u" ? "Usuario" : "Asistente"}: ${h.t}`).join("\n")
    : "(sin mensajes previos)";
  return `AHORA: ${describirLargo(ahora, tz)} (zona ${tz})

CALENDARIO:
${calendarioProximo(ahora, tz)}

BORRADOR ACTUAL:
${borrador ? JSON.stringify(borrador) : "(ninguno)"}

TAREAS PENDIENTES:
${lista}

CONVERSACIÓN RECIENTE:
${charla}

MENSAJE NUEVO DEL USUARIO:
${mensaje}`;
}

/** Saca el JSON aunque el modelo lo envuelva en texto o en ```json. */
export function extraerJson(texto: string): unknown {
  const limpio = texto.replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(limpio);
  } catch {
    const ini = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");
    if (ini >= 0 && fin > ini) return JSON.parse(limpio.slice(ini, fin + 1));
    throw new Error("La IA no devolvió JSON");
  }
}

const ACCIONES: Accion[] = ["ninguna", "guardar", "completar", "cancelar", "reprogramar", "listar"];
const REPETICIONES = ["no", "diario", "semanal", "mensual"] as const;

/** Acepta lo que venga del modelo y lo deja con la forma esperada. */
export function normalizar(crudo: unknown): Decision {
  const o = (crudo ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const entero = (v: unknown) => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
  };
  let borrador: Borrador | null = null;
  if (o.borrador && typeof o.borrador === "object") {
    const b = o.borrador as Record<string, unknown>;
    borrador = {
      titulo: texto(b.titulo),
      detalles: texto(b.detalles),
      fecha_hora: texto(b.fecha_hora),
      aviso_minutos_antes: entero(b.aviso_minutos_antes),
      repetir: REPETICIONES.includes(b.repetir as never) ? (b.repetir as Borrador["repetir"]) : "no",
    };
    if (!borrador.titulo && !borrador.detalles && !borrador.fecha_hora) borrador = null;
  }
  return {
    respuesta: texto(o.respuesta) ?? "",
    accion: ACCIONES.includes(o.accion as Accion) ? (o.accion as Accion) : "ninguna",
    borrador,
    tarea_id: entero(o.tarea_id),
    nueva_fecha_hora: texto(o.nueva_fecha_hora),
  };
}

async function conWorkersAi(env: Env, entrada: string): Promise<unknown> {
  const r = (await env.AI.run(MODELO_WORKERS_AI as Parameters<Ai["run"]>[0], {
    messages: [
      { role: "system", content: INSTRUCCIONES },
      { role: "user", content: entrada },
    ],
    response_format: { type: "json_schema", json_schema: ESQUEMA },
    max_tokens: 1024,
    temperature: 0.2,
  } as never)) as { response?: unknown };
  const resp = r.response;
  return typeof resp === "string" ? extraerJson(resp) : resp;
}

async function conClaude(env: Env, entrada: string): Promise<unknown> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const params = {
    model: env.CLAUDE_MODELO || "claude-opus-5-5",
    max_tokens: 16000,
    // Si el modelo rechaza el pedido, la API lo reintenta con otro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // Tarea corta de chat: poco esfuerzo alcanza y responde más rápido.
    output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
    system: INSTRUCCIONES,
    messages: [{ role: "user", content: entrada }],
  };
  const r = await client.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (r.stop_reason === "refusal") throw new Error("Claude rechazó el pedido");
  const texto = r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return extraerJson(texto);
}

export async function pensar(
  env: Env,
  mensaje: string,
  borrador: Borrador | null,
  tareas: Tarea[],
  historial: Turno[],
): Promise<Decision> {
  const entrada = contexto(env, mensaje, borrador, tareas, historial);
  const crudo = env.ANTHROPIC_API_KEY ? await conClaude(env, entrada) : await conWorkersAi(env, entrada);
  return normalizar(crudo);
}
