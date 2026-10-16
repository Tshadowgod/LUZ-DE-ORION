import { describe, expect, it } from "vitest";
import { extraerJson, normalizar } from "../src/cerebro";

describe("cerebro", () => {
  it("saca el JSON aunque venga envuelto", () => {
    expect(extraerJson('Claro:\n```json\n{"accion":"listar"}\n```')).toEqual({ accion: "listar" });
  });

  it("normaliza respuestas incompletas", () => {
    const d = normalizar({ accion: "inventada", borrador: { titulo: "Dentista", repetir: "x" }, tarea_id: "4" });
    expect(d.accion).toBe("ninguna");
    expect(d.borrador).toEqual({ titulo: "Dentista", detalles: null, fecha_hora: null, aviso_minutos_antes: null, repetir: "no" });
    expect(d.tarea_id).toBe(4);
  });

  it("un borrador vacío es null", () => {
    expect(normalizar({ borrador: { titulo: null, repetir: "no" } }).borrador).toBeNull();
  });
});
