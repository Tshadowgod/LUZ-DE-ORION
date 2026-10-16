// Conversiones entre hora local (la que dice el usuario) y UTC (la que se guarda).
// Sin librerías: Intl ya trae las zonas horarias.

export type Repetir = "no" | "diario" | "semanal" | "mensual";

interface Partes {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
  s: number;
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function partes(ms: number, tz: string): Partes {
  let f = formateadores.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formateadores.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Diferencia entre la hora local y UTC en ese instante, en ms. */
function desfase(ms: number, tz: string): number {
  const p = partes(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}

function dos(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-10-03T15:30" (hora local) -> epoch ms UTC. null si no se entiende. */
export function localAUtc(local: string, tz: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(local.trim());
  if (!m) return null;
  const comoUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (Number.isNaN(comoUtc)) return null;
  // Dos pasadas por si el desfase cambia justo en esa fecha (horario de verano).
  let ms = comoUtc - desfase(comoUtc, tz);
  ms = comoUtc - desfase(ms, tz);
  return ms;
}

/** epoch ms -> "2026-10-03T15:30" en hora local. */
export function utcALocal(ms: number, tz: string): string {
  const p = partes(ms, tz);
  return `${p.y}-${dos(p.m)}-${dos(p.d)}T${dos(p.h)}:${dos(p.min)}`;
}

/** epoch ms -> "2026-10-03" en hora local. */
export function diaLocal(ms: number, tz: string): string {
  return utcALocal(ms, tz).slice(0, 10);
}

/** epoch ms -> "15:30" en hora local. */
export function horaLocal(ms: number, tz: string): string {
  return utcALocal(ms, tz).slice(11, 16);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function diaSemana(dia: string): number {
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function sumarDias(dia: string, n: number): string {
  const [y, m, d] = dia.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d + n));
  return `${f.getUTCFullYear()}-${dos(f.getUTCMonth() + 1)}-${dos(f.getUTCDate())}`;
}

/** "viernes 2 de octubre de 2026, 21:05" */
export function describirLargo(ms: number, tz: string): string {
  const dia = diaLocal(ms, tz);
  const [y, m, d] = dia.split("-").map(Number);
  return `${DIAS[diaSemana(dia)]} ${d} de ${MESES[m - 1]} de ${y}, ${horaLocal(ms, tz)}`;
}

/** "hoy 15:30", "mañana 09:00", "jueves 8 oct 10:00" */
export function describirCorto(ms: number, tz: string, ahora = Date.now()): string {
  const dia = diaLocal(ms, tz);
  const hoy = diaLocal(ahora, tz);
  const hora = horaLocal(ms, tz);
  if (dia === hoy) return `hoy ${hora}`;
  if (dia === sumarDias(hoy, 1)) return `mañana ${hora}`;
  if (dia === sumarDias(hoy, -1)) return `ayer ${hora}`;
  const [y, m, d] = dia.split("-").map(Number);
  const anio = y !== +hoy.slice(0, 4) ? ` ${y}` : "";
  return `${DIAS[diaSemana(dia)]} ${d} ${MESES[m - 1].slice(0, 3)}${anio} ${hora}`;
}

/** Los próximos días con su nombre, para que la IA resuelva "el jueves". */
export function calendarioProximo(ahora: number, tz: string, dias = 14): string {
  const hoy = diaLocal(ahora, tz);
  const lineas: string[] = [];
  for (let i = 0; i < dias; i++) {
    const dia = sumarDias(hoy, i);
    const etiqueta = i === 0 ? " (hoy)" : i === 1 ? " (mañana)" : "";
    lineas.push(`${DIAS[diaSemana(dia)]} ${dia}${etiqueta}`);
  }
  return lineas.join("\n");
}

/** Siguiente repetición de una tarea, respetando la hora local. */
export function siguiente(ms: number, repetir: Repetir, tz: string): number | null {
  if (repetir === "no") return null;
  const local = utcALocal(ms, tz);
  const [dia, hora] = local.split("T");
  let nuevoDia: string;
  if (repetir === "diario") nuevoDia = sumarDias(dia, 1);
  else if (repetir === "semanal") nuevoDia = sumarDias(dia, 7);
  else {
    const [y, m, d] = dia.split("-").map(Number);
    // Día 31 en un mes de 30 -> último día de ese mes.
    const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const f = new Date(Date.UTC(y, m, Math.min(d, ultimo)));
    nuevoDia = `${f.getUTCFullYear()}-${dos(f.getUTCMonth() + 1)}-${dos(f.getUTCDate())}`;
  }
  return localAUtc(`${nuevoDia}T${hora}`, tz);
}

/** "07:00" -> minutos desde medianoche. null si viene vacío o mal escrito. */
export function minutosDelDia(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return +m[1] * 60 + +m[2];
}
