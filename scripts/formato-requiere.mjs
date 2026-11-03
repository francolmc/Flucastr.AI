// Vocabulario cerrado y análisis de la línea «- Requiere:» de la sección «## Contexto» de una tarea (F31, task-02).
// Lo usan el validador de tarea (task-03) y scripts/entorno.mjs (task-04).
// parsearRequiere(valor) devuelve { ok: true, items } o { ok: false, error } en español.
// extraerRequiere(texto) devuelve { estado: 'ausente' | 'multiple' | 'presente', valor? }.
// Función pura: no toca el disco ni git.

import { secciones } from './formato-tarea.mjs';

export const RE_REQUIERE_LINEA = /^- Requiere: (.*)$/;

const SIMPLES = new Set(['docker', 'navegador', 'red']);
const RUNTIMES = new Set(['node', 'npm', 'python', 'python3', 'go', 'java', 'deno', 'bun', 'dotnet']);
const RE_PUERTO = /^puerto:(\d+)$/;
const RE_RUNTIME = /^runtime:([a-z0-9]+)@(\d+(?:\.\d+){0,2})$/;
const RE_LARGO = /^largo:(\d+)$/;

// Devuelve el item tipado o null si el texto no pertenece al vocabulario.
function analizarItem(texto) {
  if (SIMPLES.has(texto)) return { tipo: texto, texto };

  const puerto = RE_PUERTO.exec(texto);
  if (puerto) {
    const n = puerto[1];
    if (n.length > 1 && n.startsWith('0')) return null;
    const valor = Number(n);
    if (valor < 1 || valor > 65535) return null;
    return { tipo: 'puerto', valor, texto };
  }

  const runtime = RE_RUNTIME.exec(texto);
  if (runtime) {
    if (!RUNTIMES.has(runtime[1])) return null;
    return { tipo: 'runtime', nombre: runtime[1], version: runtime[2], texto };
  }

  const largo = RE_LARGO.exec(texto);
  if (largo) {
    const n = largo[1];
    if (n.startsWith('0')) return null;
    const valor = Number(n);
    if (valor < 1 || valor > 3600) return null;
    return { tipo: 'largo', valor, texto };
  }

  return null;
}

export function parsearRequiere(valor) {
  const texto = String(valor);
  if (texto === 'ninguno') return { ok: true, items: [] };
  if (texto === '') {
    return { ok: false, error: 'La línea «- Requiere:» está vacía; usa «ninguno» o una lista de items.' };
  }

  const partes = texto.split(', ');
  if (partes.includes('ninguno')) {
    return { ok: false, error: '«ninguno» no se combina con otros items en «- Requiere:».' };
  }

  const vistos = new Set();
  const items = [];
  for (const parte of partes) {
    if (parte === '') {
      return { ok: false, error: 'Hay un item vacío en «- Requiere:»; el separador es «, » (coma y espacio).' };
    }
    if (vistos.has(parte)) {
      return { ok: false, error: `El item «${parte}» está repetido en «- Requiere:».` };
    }
    vistos.add(parte);

    const item = analizarItem(parte);
    if (!item) {
      return { ok: false, error: `El item «${parte}» no está en el vocabulario de «Requiere:».` };
    }
    items.push(item);
  }
  return { ok: true, items };
}

export function extraerRequiere(texto) {
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const contexto = secciones(todo.split('\n')).find((s) => s.titulo === 'Contexto');
  const valores = [];
  for (const linea of contexto?.lineas ?? []) {
    const coincide = RE_REQUIERE_LINEA.exec(linea);
    if (coincide) valores.push(coincide[1]);
  }

  if (valores.length === 0) return { estado: 'ausente' };
  if (valores.length > 1) return { estado: 'multiple' };
  return { estado: 'presente', valor: valores[0] };
}
