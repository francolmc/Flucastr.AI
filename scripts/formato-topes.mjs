// Mide los topes de contexto de la línea «- Leer:» de «## Contexto» (definitions/F42-TOPES.md §3).
// Función pura, igual que validarFuente de formato-fuente.mjs: no toca el disco ni git.
// medirTopes(texto, leer) devuelve { errores, avisos } (arreglos de motivos en español; vacíos = válida).
// leer(ruta) devuelve el texto del archivo o null si no se puede leer. El CLI lo cablea en task-03.

import { secciones } from './formato-tarea.mjs';

export const MAX_LEER = 4;
export const MAX_BYTES_CONTEXTO = 12288;
export const AVISO_BYTES_CONTEXTO = 9216;

const ESTADOS_EXENTOS = ['hecha', 'cancelada'];
const PREFIJO = '- Leer:';
const RE_LEER = /^- Leer: (.+)$/;
const RE_ITEM = /^`(.+?)(?:@(\d+)-(\d+))?`$/;
const FORMATO = 'La línea «Leer» tiene formato inválido: debe ser «- Leer: `ruta`, `ruta@offset-limit`», en una sola línea, sin punto final ni texto extra.';

function sinMotivos() {
  return { errores: [], avisos: [] };
}

function bytesDe(texto, offset, limit) {
  if (offset === undefined) return Buffer.byteLength(texto);
  const elegidas = texto.split('\n').slice(offset - 1, offset - 1 + limit);
  return Buffer.byteLength(`${elegidas.join('\n')}\n`);
}

export function medirTopes(texto, leer) {
  const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n');
  const estado = /estado: (\S.*?)\s*$/.exec(lineas[1] ?? '')?.[1];
  if (ESTADOS_EXENTOS.includes(estado)) return sinMotivos();

  const contexto = secciones(lineas).find((s) => s.titulo === 'Contexto');
  const vinetas = (contexto?.lineas ?? []).filter((l) => l.startsWith(PREFIJO));
  if (vinetas.length === 0) return sinMotivos();
  if (vinetas.length > 1) {
    return { errores: ['Hay más de una línea «- Leer:» en «## Contexto».'], avisos: [] };
  }

  const coincide = RE_LEER.exec(vinetas[0]);
  if (!coincide) return { errores: [FORMATO], avisos: [] };

  const items = coincide[1].split(', ').map((p) => RE_ITEM.exec(p));
  if (items.some((m) => m === null)) return { errores: [FORMATO], avisos: [] };

  const errores = [];
  const avisos = [];
  if (items.length > MAX_LEER) {
    errores.push(`«Leer» tiene ${items.length} archivos; el tope es ${MAX_LEER} (WORKFLOW.md §6).`);
  }

  let total = 0;
  for (const m of items) {
    const ruta = m[1];
    const offset = m[2] === undefined ? undefined : Number(m[2]);
    const limit = m[3] === undefined ? undefined : Number(m[3]);
    if (offset !== undefined && (offset < 1 || limit < 1)) {
      errores.push(`El rango de «Leer» tiene offset o limit menor que 1: ${ruta}.`);
      continue;
    }
    const texto = leer(ruta);
    if (texto === null || texto === undefined) {
      errores.push(`El archivo de Leer no se puede leer: ${ruta}.`);
      continue;
    }
    total += bytesDe(String(texto), offset, limit);
  }

  if (total > MAX_BYTES_CONTEXTO) {
    errores.push(`El contexto a leer mide ${total} bytes; el tope es ${MAX_BYTES_CONTEXTO} (12 KB).`);
  } else if (total > AVISO_BYTES_CONTEXTO && errores.length === 0) {
    avisos.push(`El contexto a leer mide ${total} bytes; pasa de ${AVISO_BYTES_CONTEXTO} (9 KB).`);
  }

  return { errores, avisos };
}
