// Lectura del encargo de un subagente (F32, task-08): qué disparó la delegación y a qué tarea pertenece.
// Solo devuelve valores de vocabulario cerrado y la ruta de tarea (feature, tarea); nunca texto libre del encargo.
// parsearDisparo(texto) devuelve { origen: 'puerta', puerta } | { origen: 'bloqueo', tarea } | { origen: 'franco' } | { origen: 'reintento' } | null.
// rutaDeTarea(texto) devuelve { feature, tarea } | null.
// resumirEncargo(texto) devuelve { disparo, feature, tarea } (todo null si el texto no es string).
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
