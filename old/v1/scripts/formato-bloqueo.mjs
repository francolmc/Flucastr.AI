// Vocabulario cerrado y analizador de las líneas «Bloqueo:» y «Cancelada:» de la sección «## Notas» de una tarea (F32, task-01).
// parsearBloqueo(linea) y parsearCancelada(linea) devuelven { ok: true, ... } o { ok: false, error } en español.
// coherenciaBloqueo({ tipo, causa }) devuelve motivos en español que empiezan con «Bloqueo»; vacío = coherente.
// lineasDeNotas(texto, prefijo) devuelve las líneas de «## Notas» (fuera de bloques de código) que empiezan con prefijo.
// Función pura: no toca el disco ni git.

import { secciones } from './formato-tarea.mjs';
import { parsearRequiere } from './formato-requiere.mjs';

export const TIPOS_BLOQUEO = ['entorno', 'alcance', 'especificacion', 'decision_diseno', 'verificacion_x2', 'credenciales', 'otra'];
export const MOTIVOS_CANCELADA = ['replanificada', 'obsoleta', 'duplicada', 'fuera_de_alcance', 'otra'];

const RE_BLOQUEO = /^Bloqueo: tipo=([^;]*); falta=(.*)$/;
const RE_CANCELADA = /^Cancelada: motivo=(.*)$/;

export function parsearBloqueo(linea) {
  const coincide = RE_BLOQUEO.exec(String(linea));
  if (!coincide) {
    return { ok: false, error: 'La línea de bloqueo debe tener la forma «Bloqueo: tipo=<tipo>; falta=<valor>».' };
  }

  const tipo = coincide[1];
  if (!TIPOS_BLOQUEO.includes(tipo)) {
    return { ok: false, error: `El tipo «${tipo}» no está en el vocabulario de «Bloqueo:» (${TIPOS_BLOQUEO.join(', ')}).` };
  }

  const valor = coincide[2];
  if (valor.includes(';')) {
    return { ok: false, error: 'La línea «Bloqueo:» solo admite las claves tipo y falta; quita el texto extra.' };
  }

  if (valor === '-') {
    if (tipo === 'entorno') {
      return { ok: false, error: 'Con «tipo=entorno» «falta» debe listar al menos un item, no «-».' };
    }
    return { ok: true, tipo, falta: [] };
  }

  // Acepta «,» y «, » como separador; se normaliza a «, » antes de validar.
  const normal = valor.replace(/, ?/g, ', ');
  const requiere = parsearRequiere(normal);
  if (!requiere.ok) {
    return { ok: false, error: requiere.error };
  }
  return { ok: true, tipo, falta: requiere.items.map((item) => item.texto) };
}

export function parsearCancelada(linea) {
  const coincide = RE_CANCELADA.exec(String(linea));
  if (!coincide) {
    return { ok: false, error: 'La línea de cancelación debe tener la forma «Cancelada: motivo=<motivo>».' };
  }

  const motivo = coincide[1];
  if (!MOTIVOS_CANCELADA.includes(motivo)) {
    return { ok: false, error: `El motivo «${motivo}» no está en el vocabulario de «Cancelada:» (${MOTIVOS_CANCELADA.join(', ')}).` };
  }
  return { ok: true, motivo };
}

export function coherenciaBloqueo({ tipo, causa }) {
  const motivos = [];
  if (causa === undefined) return motivos;

  const exigencias = {
    entorno: 'otra',
    credenciales: 'credenciales',
    verificacion_x2: 'verificacion_x2',
  };
  const exigida = exigencias[tipo];
  if (exigida !== undefined && causa !== exigida) {
    motivos.push(`Bloqueo: tipo=${tipo} exige causa=${exigida}; se recibió causa=${causa}.`);
  }
  return motivos;
}

export function lineasDeNotas(texto, prefijo) {
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const notas = secciones(todo.split('\n')).find((s) => s.titulo === 'Notas');
  const resultado = [];
  let enCodigo = false;
  for (const linea of notas?.lineas ?? []) {
    if (/^```/.test(linea)) {
      enCodigo = !enCodigo;
      continue;
    }
    if (enCodigo) continue;
    const limpia = linea.replace(/\s+$/, '');
    if (limpia.startsWith(prefijo)) resultado.push(limpia);
  }
  return resultado;
}
