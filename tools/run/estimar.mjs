// Estimación de créditos para la nota paso 4 de kit run (A7 de changes/escalera-recuperacion/plan.md). Funciones puras:
// kit run lee scripts/rates.json y pasa las tarifas. Los tokens los da la persona con --tokens entrada,caché,salida;
// se supone el mismo volumen en cada modelo y el resultado se rotula «estimación». Sin tarifa o sin tokens, un texto.

const SIN_TARIFA = "sin tarifa";
const SIN_TOKENS = "sin tokens medidos";

// «entrada,caché,salida» con tres enteros ≥ 0; cualquier otra cosa da null.
export function leerTokens(texto) {
  const partes = String(texto ?? "").split(",").map((x) => x.trim());
  if (partes.length !== 3 || !partes.every((x) => /^\d+$/.test(x))) return null;
  const [entrada, cache, salida] = partes.map(Number);
  return { entrada, cache, salida };
}

// Un valor por modelo: créditos (redondeados a 2 decimales) o el texto «sin tarifa» / «sin tokens medidos».
// Tarifas: scripts/rates.json (campo modelos): créditos por millón de tokens de entrada, caché y salida.
export function estimar({ tokens = null, modelos = [], tarifas = {} } = {}) {
  return modelos.map((modelo) => {
    if (!tokens) return { modelo, valor: SIN_TOKENS };
    const tarifa = tarifas[String(modelo).replace(/^openai\//, "")];
    if (!tarifa) return { modelo, valor: SIN_TARIFA };
    const creditos = (tokens.entrada * tarifa.entrada + tokens.cache * tarifa.entrada_cache + tokens.salida * tarifa.salida) / 1e6;
    return { modelo, valor: Math.round(creditos * 100) / 100 };
  });
}

const etiqueta = (valor) => (typeof valor === "number" ? String(valor) : `«${valor}»`);

// Línea de la nota paso 4 (kit run la escribe en Notas): créditos del paso 3 y del relevo, y la pregunta.
// No ejecuta nada: el relevo lo decide la persona. «cierre» (opcional) añade la instrucción para cerrar el relevo.
export function notaPaso4({ causa, nivel, modeloBuilder, modeloPlanner, tokens = null, tarifas = {}, cierre = null }) {
  const [paso3, relevo] = estimar({ tokens, modelos: [modeloBuilder, modeloPlanner], tarifas });
  const resumen = String(causa ?? "").replace(/\s+/g, " ").slice(0, 200);
  return `paso 4: el paso 3 (nivel ${nivel}, modelo ${modeloBuilder}) no terminó: ${resumen}. Créditos del paso 3: ${etiqueta(paso3.valor)} (estimación). Relevo al planner (modelo ${modeloPlanner}): ${etiqueta(relevo.valor)} (estimación). Pregunta de relevo: ¿lo quieres? La persona responde; kit run no lo ejecuta ni corre nada más.${cierre ? ` ${cierre}` : ""}`;
}
