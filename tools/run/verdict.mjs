const ESQUEMA_VEREDICTO = {
  type: "object",
  additionalProperties: false,
  required: ["veredicto", "defectos"],
  properties: {
    veredicto: { enum: ["APROBADO", "DEVUELTO", "PAUSA"] },
    defectos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["archivo", "linea", "criterio", "descripcion"],
        properties: {
          archivo: { type: "string" },
          linea: { type: "integer" },
          criterio: { type: "string" },
          descripcion: { type: "string" },
        },
      },
    },
  },
};

// Valida el veredicto del revisor contra ESQUEMA_VEREDICTO. Devuelve { ok, error, datos }.
function validarVeredicto(texto) {
  let datos;
  try {
    datos = JSON.parse(texto.trim());
  } catch {
    return { ok: false, error: "la salida no es JSON" };
  }
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return { ok: false, error: "no es un objeto" };
  const claves = Object.keys(datos).sort();
  if (claves.join(",") !== "defectos,veredicto") return { ok: false, error: `claves inesperadas: ${claves.join(",")}` };
  if (!["APROBADO", "DEVUELTO", "PAUSA"].includes(datos.veredicto)) return { ok: false, error: `veredicto inválido: ${datos.veredicto}` };
  if (!Array.isArray(datos.defectos)) return { ok: false, error: "defectos no es una lista" };
  for (const d of datos.defectos) {
    const ok = d && typeof d === "object" && typeof d.archivo === "string" && Number.isInteger(d.linea)
      && typeof d.criterio === "string" && typeof d.descripcion === "string"
      && Object.keys(d).length === 4;
    if (!ok) return { ok: false, error: "un defecto no cumple el esquema" };
  }
  if (datos.veredicto === "APROBADO" && datos.defectos.length > 0) return { ok: false, error: "APROBADO con defectos" };
  if (datos.veredicto === "DEVUELTO" && datos.defectos.length === 0) return { ok: false, error: "DEVUELTO sin defectos" };
  return { ok: true, datos };
}

export { ESQUEMA_VEREDICTO, validarVeredicto };
