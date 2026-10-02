import { describe, expect, it } from "vitest";
import { describirCorto, localAUtc, siguiente, utcALocal } from "../src/fechas";

describe("fechas", () => {
  it("convierte hora local de La Paz (UTC-4) a UTC y vuelta", () => {
    const ms = localAUtc("2026-10-03T15:30", "America/La_Paz")!;
    expect(new Date(ms).toISOString()).toBe("2026-10-03T19:30:00.000Z");
    expect(utcALocal(ms, "America/La_Paz")).toBe("2026-10-03T15:30");
  });

  it("respeta el horario de verano", () => {
    // Nueva York: EDT (UTC-4) en julio, EST (UTC-5) en diciembre.
    expect(new Date(localAUtc("2026-07-01T09:00", "America/New_York")!).toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(new Date(localAUtc("2026-12-01T09:00", "America/New_York")!).toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("rechaza formatos raros", () => {
    expect(localAUtc("mañana a las 3", "America/La_Paz")).toBeNull();
  });

  it("calcula repeticiones", () => {
    const tz = "America/La_Paz";
    const base = localAUtc("2026-01-31T08:00", tz)!;
    expect(utcALocal(siguiente(base, "diario", tz)!, tz)).toBe("2026-02-01T08:00");
    expect(utcALocal(siguiente(base, "semanal", tz)!, tz)).toBe("2026-02-07T08:00");
    expect(utcALocal(siguiente(base, "mensual", tz)!, tz)).toBe("2026-02-28T08:00");
    expect(siguiente(base, "no", tz)).toBeNull();
  });

  it("describe fechas cercanas", () => {
    const tz = "America/La_Paz";
    const ahora = localAUtc("2026-10-02T21:00", tz)!;
    expect(describirCorto(localAUtc("2026-10-02T22:00", tz)!, tz, ahora)).toBe("hoy 22:00");
    expect(describirCorto(localAUtc("2026-10-03T09:00", tz)!, tz, ahora)).toBe("mañana 09:00");
    expect(describirCorto(localAUtc("2026-10-08T10:00", tz)!, tz, ahora)).toBe("jueves 8 oct 10:00");
  });
});
