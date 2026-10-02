// Prueba de punta a punta con D1 local (Miniflare), la IA simulada y Telegram interceptado.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { getPlatformProxy } from "wrangler";
import worker from "../src/index";
import { revisar } from "../src/recordatorios";
import { localAUtc, utcALocal } from "../src/fechas";
import type { Env } from "../src/env";

const TZ = "America/La_Paz";
let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>;
let env: Env;
const enviados: { chat_id: string; text: string; botones?: string[] }[] = [];
let respuestasIa: unknown[] = [];
const pendientes: Promise<unknown>[] = [];
const ctx = { waitUntil: (p: Promise<unknown>) => pendientes.push(p), passThroughOnException() {}, props: {} } as unknown as ExecutionContext;

async function mandar(texto: string) {
  const req = new Request("https://x/telegram", {
    method: "POST",
    headers: { "x-telegram-bot-api-secret-token": "s3creto", "content-type": "application/json" },
    body: JSON.stringify({ message: { chat: { id: 42 }, text: texto } }),
  });
  const r = await worker.fetch(req as never, env, ctx);
  await Promise.all(pendientes.splice(0));
  return r;
}

beforeAll(async () => {
  proxy = await getPlatformProxy<Env>({ configPath: "wrangler.test.jsonc", persist: false });
  const sql = readFileSync("schema.sql", "utf8").replace(/--.*$/gm, "");
  for (const q of sql.split(";").map((s) => s.trim()).filter(Boolean)) await proxy.env.DB.prepare(q).run();
  env = {
    ...proxy.env,
    ZONA_HORARIA: TZ,
    HORA_RESUMEN: "",
    AVISO_PREVIO_MIN: "30",
    USUARIOS_PERMITIDOS: "tg:42",
    TELEGRAM_BOT_TOKEN: "x",
    TELEGRAM_SECRETO: "s3creto",
    AI: { run: async () => ({ response: respuestasIa.shift() }) } as unknown as Ai,
  } as Env;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const cuerpo = JSON.parse(String(init.body));
    enviados.push({
      chat_id: cuerpo.chat_id,
      text: cuerpo.text,
      botones: cuerpo.reply_markup?.inline_keyboard?.[0]?.map((b: { callback_data: string }) => b.callback_data),
    });
    return Response.json({ ok: true, result: {} });
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await proxy?.dispose();
});

describe("flujo completo", () => {
  it("rechaza webhooks sin secreto", async () => {
    const r = await worker.fetch(new Request("https://x/telegram", { method: "POST", body: "{}" }) as never, env, ctx);
    expect(r.status).toBe(401);
  });

  it("pregunta detalles, guarda y avisa", async () => {
    const manana = utcALocal(Date.now() + 24 * 3_600_000, TZ).slice(0, 10);
    const borrador = { titulo: "Dentista", detalles: null, fecha_hora: `${manana}T10:00`, aviso_minutos_antes: null, repetir: "no" };

    respuestasIa.push({ respuesta: "Dentista mañana 10:00. ¿Dónde es y cuánto antes te aviso?", accion: "ninguna", borrador, tarea_id: null, nueva_fecha_hora: null });
    await mandar("mañana a las 10 tengo dentista");
    expect(enviados.at(-1)!.text).toContain("¿Dónde es");

    respuestasIa.push({ respuesta: "", accion: "guardar", borrador: { ...borrador, detalles: "Clínica Sur", aviso_minutos_antes: 60 }, tarea_id: null, nueva_fecha_hora: null });
    await mandar("en la Clínica Sur, avísame una hora antes");
    const conf = enviados.at(-1)!.text;
    expect(conf).toContain("✅ Anotado: Dentista");
    expect(conf).toContain("mañana 10:00");
    expect(conf).toContain("60 min antes");

    const cita = localAUtc(`${manana}T10:00`, TZ)!;
    enviados.length = 0;
    await revisar(env, cita - 59 * 60_000);
    expect(enviados[0].text).toBe("🔔 En 59 min (10:00): Dentista\n📝 Clínica Sur");

    await revisar(env, cita + 30_000);
    expect(enviados[1].text).toContain("⏰ Es hora: Dentista");
    expect(enviados[1].botones?.[0]).toMatch(/^hecho:\d+$/);

    await revisar(env, cita + 90_000);
    expect(enviados).toHaveLength(2); // no repite avisos

    respuestasIa.push({ respuesta: "Esto es lo que tienes:", accion: "listar", borrador: null, tarea_id: null, nueva_fecha_hora: null });
    await mandar("qué tengo pendiente?");
    expect(enviados.at(-1)!.text).toContain("Dentista");
  });

  it("no deja usar el bot a desconocidos", async () => {
    await worker.fetch(
      new Request("https://x/telegram", {
        method: "POST",
        headers: { "x-telegram-bot-api-secret-token": "s3creto" },
        body: JSON.stringify({ message: { chat: { id: 7 }, text: "hola" } }),
      }) as never,
      env,
      ctx,
    );
    await Promise.all(pendientes.splice(0));
    expect(enviados.at(-1)).toMatchObject({ chat_id: "7" });
    expect(enviados.at(-1)!.text).toContain("tg:7");
  });
});
