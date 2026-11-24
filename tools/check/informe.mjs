// Informe común de kit-scope y kit-close: una lista de filas con nivel, y un código de salida derivado.
// Puro: no lee ni escribe nada. La tabla y el JSON salen del mismo objeto, así no pueden discrepar.
//
// Niveles de fila: ok | aviso | error | no_verificable. Los avisos no cambian el código.
// Códigos: 0 sin errores ni «no verificable»; 1 hay errores; 3 sin errores pero hay «no verificable».
// El código 2 (uso o plan mal formado) lo decide el CLI, no este módulo.

export const NIVELES = ["ok", "aviso", "error", "no_verificable"];

const ETIQUETA = { ok: "ok", aviso: "aviso", error: "error", no_verificable: "no verificable" };

// Normaliza filas: cada una lleva `nivel` válido, `elemento` (ruta, A#, paso...) y `mensaje`.
export function crearInforme(filas) {
  const normalizadas = filas.map(f => {
    if (!NIVELES.includes(f.nivel)) throw new Error(`nivel no válido: ${f.nivel}`);
    return { nivel: f.nivel, elemento: f.elemento ?? null, mensaje: f.mensaje ?? "" };
  });
  const resumen = Object.fromEntries(NIVELES.map(n => [n, 0]));
  for (const f of normalizadas) resumen[f.nivel]++;
  return { codigo: codigoSalida({ resumen }), resumen, filas: normalizadas };
}

// Código de salida según el resumen: error gana a no verificable; avisos no cuentan.
export function codigoSalida(informe) {
  if (informe.resumen.error > 0) return 1;
  if (informe.resumen.no_verificable > 0) return 3;
  return 0;
}

// Tabla legible en texto plano (sin color, válida para terminal y para registros).
export function tabla(informe) {
  const lineas = informe.filas.map(f => {
    const elemento = f.elemento ?? "-";
    return `${ETIQUETA[f.nivel].padEnd(16)} ${elemento.padEnd(28)} ${f.mensaje}`.trimEnd();
  });
  const cabecera = `${"nivel".padEnd(16)} ${"elemento".padEnd(28)} detalle`;
  const resumen = NIVELES.map(n => `${ETIQUETA[n]} ${informe.resumen[n]}`).join(", ");
  return [cabecera, ...lineas, "", `resumen: ${resumen}`, `codigo: ${informe.codigo}`].join("\n");
}
