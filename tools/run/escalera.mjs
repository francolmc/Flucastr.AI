// Decisión de la escalera de recuperación de kit run (paso 0). Funciones puras: no leen archivos ni procesos.
// Reglas en changes/escalera-recuperacion/plan.md (Handoff y Decisions D3) y tramo-2.md.
// decidir: infra relanza mientras queden cupos; tarea sigue la conducta actual; entorno, plan y decisión devuelven a la persona.
// diagnostico: nota de una línea para el plan, sin la palabra «relevo» (no se ofrece relevo en este paso).

const QUE_HACER = {
  infra: "el proceso murió por infraestructura y se agotaron las repeticiones con el mismo modelo; revisar memoria, contexto o tiempo del proceso y volver a correr kit run",
  entorno: "corregir el entorno (espacio, Docker, permisos, navegador, límite de uso o red) y volver a correr kit run; no se gastó ninguna corrida extra",
  plan: "revisar el alcance o el plan con la persona antes de volver a correr kit run; el builder no lo puede resolver solo",
  decision: "tomar la decisión que pide el builder o el revisor, dejarla escrita en el plan con Resuelto: y volver a correr kit run",
  tarea: "revisar el defecto de verificación, puerta mecánica o revisión que devolvió el intento",
};

// Relanzamientos de tarea permitidos por tramo (kit run y kit-escalera).
export const MAX_RELANZAMIENTOS = 2;
export const MAX_CONSEJO = 2000;

// Consejo del planner: una línea que empieza por «Consejo (tramo N):» (con «- » opcional), con texto distinto de «…»
// y ≤ 2000 caracteres. Las notas de kit run («- kit run: paso 2: escribe «Consejo …») no cuentan. Devuelve la última o null.
export function consejoDelPlan(texto, tramo) {
  let ultimo = null;
  for (const m of String(texto ?? "").matchAll(new RegExp(`^(?:- )?Consejo \\(tramo ${tramo ?? 1}\\):[ \\t]*(.*)$`, "gm"))) ultimo = m[1].trim();
  return ultimo && ultimo !== "…" && ultimo.length <= MAX_CONSEJO ? ultimo : null;
}

// Historial del tramo desde el último DONE de runs.jsonl. usados = relanzamientos ya consumidos (máximo de la columna
// relanzamientos), fallasTarea = intentos con clase tarea, paso = mayor paso alcanzado. Líneas ilegibles se saltan.
export function historial(lineas, plan, tramo) {
  const registros = [];
  for (const linea of lineas ?? []) {
    let r;
    try { r = JSON.parse(linea); } catch { continue; }
    if (r && r.plan === plan && (r.tramo ?? null) === (tramo ?? null)) registros.push(r);
  }
  let inicio = 0;
  registros.forEach((r, i) => { if (r.resultado === "DONE") inicio = i + 1; });
  const ventana = registros.slice(inicio);
  const maximo = (campo) => Math.max(0, ...ventana.map((r) => Number(r[campo]) || 0));
  // pasoTresTarea: un paso 3 ya falló por tarea (solo ese caso impide repetir --paso 3; tras entorno sí se puede).
  return { usados: maximo("relanzamientos"), fallasTarea: ventana.filter((r) => r.clase === "tarea").length, paso: maximo("paso"), pasoTresTarea: ventana.some((r) => r.paso === 3 && r.clase === "tarea") };
}

// Clase → acción. Infra relanza solo si quedan cupos (usados < limite); el contador es el mismo de los relanzamientos de tarea (D3).
export function decidir({ clase, usados = 0, limite = 2, fallasTarea = 0, consejo = false } = {}) {
  if (clase === "infra") return { accion: usados < limite ? "relanzar" : "devolver" };
  if (clase === "tarea") return decidirTarea({ usados, limite, fallasTarea, consejo });
  return { accion: "devolver" };
}

// Tarea (verificación, puerta o revisor): la primera falla relanza con handoff (paso 1); la segunda pausa pidiendo
// consejo; con consejo, el paso 2 es el segundo relanzamiento. Sin cupo o tras el paso 2, se agota.
function decidirTarea({ usados, limite, fallasTarea, consejo }) {
  if (usados >= limite) return { accion: "devolver", agotada: true };
  if (fallasTarea <= 1) return { accion: "relanzar", paso: 1 };
  if (fallasTarea === 2) return consejo ? { accion: "relanzar", paso: 2 } : { accion: "consejo" };
  return { accion: "devolver", agotada: true };
}

// Línea de diagnóstico para la nota del plan: clase, señal y qué hacer.
export function diagnostico({ clase, senal }) {
  return `Diagnóstico: clase=${clase}; señal=${senal ?? "desconocida"}; qué hacer=${QUE_HACER[clase] ?? QUE_HACER.tarea}`;
}

// Últimas n líneas de un texto de salida: solo esto se pasa a clasificar (el stderr del builder puede traer texto del proyecto).
export function ultimasLineas(texto, n = 40) {
  return String(texto ?? "").split("\n").slice(-n).join("\n");
}
