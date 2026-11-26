// Razón de líneas de prueba frente a producto de una rama (puro: no lee ni escribe nada).
// Clasificación igual a changes/reducir-contrato-builder/medir-razon.mjs: prueba = líneas añadidas;
// producto = añadidas + borradas; se ignora changes/ y docs/, documentos y lockfiles; los binarios no cuentan.
// Aviso solo si hay 100 o más líneas de prueba y prueba > 3 × producto (sin divisiones: 3.0 exacta no avisa).

const TEST = /(^|\/)(tests?|__tests__|specs?|e2e|pruebas)\/|[._-](test|spec)\.[A-Za-z0-9]+$|(^|\/)test_[^/]*\.py$/;
const IGNORADA = /^(changes|docs)\//;
const DOCUMENTO = /\.(md|mdx|txt)$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|poetry\.lock|go\.sum|composer\.lock|Gemfile\.lock)$/;

export const MINIMO_PRUEBA = 100;
export const RAZON_MAXIMA = 3;

// «prueba», «producto» o null (no cuenta).
export function clasificar(ruta) {
  if (IGNORADA.test(ruta)) return null;
  if (TEST.test(ruta)) return "prueba";
  if (DOCUMENTO.test(ruta)) return null;
  return "producto";
}

// Suma de entradas { ruta, añadidas, borradas }; `añadidas` null significa binario (no cuenta).
export function contar(entradas) {
  let prueba = 0;
  let producto = 0;
  for (const e of entradas) {
    if (e.añadidas === null) continue;
    const clase = clasificar(e.ruta);
    if (clase === "prueba") prueba += e.añadidas;
    else if (clase === "producto") producto += e.añadidas + e.borradas;
  }
  return { prueba, producto };
}

// Fila de aviso o null. Nunca cambia el código de salida.
export function avisoProporcion({ prueba, producto }) {
  if (prueba < MINIMO_PRUEBA || producto === 0) return null;
  if (prueba <= RAZON_MAXIMA * producto) return null;
  const razon = (prueba / producto).toFixed(2);
  return {
    nivel: "aviso",
    elemento: null,
    mensaje: `pruebas/producto ${razon} (${prueba} líneas de prueba, ${producto} de producto): supera ${RAZON_MAXIMA.toFixed(1)}; revisa que sean proporcionales`,
  };
}
