// Lectura del encargo de un subagente (F32, task-08): qué disparó la delegación y a qué tarea pertenece.
// Solo devuelve valores de vocabulario cerrado y la ruta de tarea (feature, tarea); nunca texto libre del encargo.
// parsearDisparo(texto) devuelve { origen: 'puerta', puerta } | { origen: 'bloqueo', tarea } | { origen: 'franco' } | { origen: 'reintento' } | null.
// rutaDeTarea(texto) devuelve { feature, tarea } | null.
// resumirEncargo(texto) devuelve { disparo, feature, tarea } (todo null si el texto no es string).
// listaDeRutas(texto, clave) devuelve string[] con las rutas de la línea `Lee:` o `Evita leer:` (clave); [] si no hay línea.
// normalizarRuta(ruta) cambia \ por /, quita ./ inicial y recorta hasta la carpeta raíz conocida (definitions/, features/, ...).
// rutaCalza(ruta, entrada) compara normalizadas: si la entrada termina en / calza por prefijo, si no por igualdad.
// declaracionesLecturaExtra(textos) devuelve Set de rutas normalizadas de las líneas `Lectura extra: <ruta>; motivo=...` (el motivo no se guarda).
// resumirLecturaExtra({ encargo, rutas, textos }) devuelve { extras, declaradas }: rutas leídas fuera de Lee y dentro de Evita leer.
// Función pura: no toca el disco, ni git, ni el entorno.

const RE_DISPARO = /^Disparó: (puerta ([1-4])|BLOQUEO task-(\d{2})|franco|reintento)[ \t\r]*$/m;
const RE_RUTA_TAREA = /features\/(F\d{2})-[A-Za-z0-9._-]+\/task-(\d{2})-[A-Za-z0-9._-]+\.md/;
const RE_FEATURE = /features\/(F\d{2})-/;

export function parsearDisparo(texto) {
  if (typeof texto !== 'string') return null;
  const coincide = RE_DISPARO.exec(texto);
  if (!coincide) return null;
  if (coincide[2] !== undefined) return { origen: 'puerta', puerta: Number(coincide[2]) };
  if (coincide[3] !== undefined) return { origen: 'bloqueo', tarea: coincide[3] };
  if (coincide[1] === 'franco') return { origen: 'franco' };
  return { origen: 'reintento' };
}

export function rutaDeTarea(texto) {
  if (typeof texto !== 'string') return null;
  const coincide = RE_RUTA_TAREA.exec(texto);
  if (!coincide) return null;
  return { feature: coincide[1], tarea: coincide[2] };
}

export function resumirEncargo(texto) {
  if (typeof texto !== 'string') return { disparo: null, feature: null, tarea: null };
  const disparo = parsearDisparo(texto);
  const ruta = rutaDeTarea(texto);
  if (ruta) return { disparo, feature: ruta.feature, tarea: ruta.tarea };
  const feature = RE_FEATURE.exec(texto)?.[1] ?? null;
  return { disparo, feature, tarea: disparo?.tarea ?? null };
}

const RAICES_CONOCIDAS = /(^|\/)(definitions|features|registro|agentes|skills|scripts|pruebas|assets)\//;
const RE_TOKEN_RUTA = /^[A-Za-z0-9._\/-]+$/;

export function listaDeRutas(texto, clave) {
  if (typeof texto !== 'string') return [];
  const linea = new RegExp(`^${clave}:[ \\t]*(.*)$`, 'm').exec(texto);
  if (!linea) return [];
  const rutas = [];
  for (const trozo of linea[1].split(/[,;]/)) {
    const conBacktick = /`([^`]+)`/.exec(trozo);
    const token = conBacktick ? conBacktick[1] : (trozo.trim().split(/\s+/)[0] ?? '');
    if (RE_TOKEN_RUTA.test(token) && (token.includes('/') || token.includes('.'))) rutas.push(token);
  }
  return rutas;
}

export function normalizarRuta(ruta) {
  if (typeof ruta !== 'string') return '';
  const limpia = ruta.replace(/\\/g, '/').replace(/^\.\//, '');
  const coincide = RAICES_CONOCIDAS.exec(limpia);
  if (!coincide) return limpia;
  return limpia.slice(coincide.index + coincide[1].length);
}

export function rutaCalza(ruta, entrada) {
  const a = normalizarRuta(ruta);
  const b = normalizarRuta(entrada);
  if (!a || !b) return false;
  return b.endsWith('/') ? a.startsWith(b) : a === b;
}

export function declaracionesLecturaExtra(textos) {
  const declaradas = new Set();
  if (!Array.isArray(textos)) return declaradas;
  for (const texto of textos) {
    if (typeof texto !== 'string') continue;
    for (const coincide of texto.matchAll(/^Lectura extra: (\S+); motivo=/gm)) {
      declaradas.add(normalizarRuta(coincide[1]));
    }
  }
  return declaradas;
}

export function resumirLecturaExtra({ encargo, rutas = [], textos = [] } = {}) {
  if (typeof encargo !== 'string') return { extras: [], declaradas: 0 };
  const lee = listaDeRutas(encargo, 'Lee');
  const evita = listaDeRutas(encargo, 'Evita leer');
  const declaradas = declaracionesLecturaExtra(textos);
  const extras = new Set();
  for (const ruta of Array.isArray(rutas) ? rutas : []) {
    if (typeof ruta !== 'string') continue;
    const esExtra = evita.some((entrada) => rutaCalza(ruta, entrada))
      && !lee.some((entrada) => rutaCalza(ruta, entrada));
    if (esExtra) extras.add(normalizarRuta(ruta));
  }
  const ordenadas = [...extras].filter(Boolean).sort();
  return {
    extras: ordenadas,
    declaradas: ordenadas.filter((ruta) => declaradas.has(ruta)).length,
  };
}
