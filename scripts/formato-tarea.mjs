// Núcleo del validador de la plantilla de tarea (definitions/WORKFLOW.md §6); lo usa scripts/validar-tarea.mjs y lo re-exporta pruebas/comprobaciones/formato-tarea.mjs.
// validarTarea(texto) devuelve un arreglo de mensajes de error en español; vacío = válida.

import { extraerRequiere, parsearRequiere } from './formato-requiere.mjs';

export const SECCIONES = [
  'Descripción',
  'Contexto',
  'Decisiones ya tomadas',
  'Decisiones abiertas',
  'Alcance / Fuera de alcance',
  'Pasos',
  'Criterios de aceptación',
  'Verificación',
  'Evidencia',
  'Notas',
];

export const MAX_CARACTERES = 8192;

const SECCIONES_LIBRES = ['Evidencia', 'Notas'];
const ESTADOS_QUE_EXIGEN_EVIDENCIA = ['lista para revisión', 'hecha'];

const RE_PRIMERA = /^# task-\d{2} — \S/;
const RE_SEGUNDA = /^repo: (\S.*?) {2,}depende_de: (\S.*?) {2,}estado: (borrador|aprobada|en curso|lista para revisión|hecha|bloqueada)\s*$/;
const RE_DEPENDE = /^(—|task-\d{2}(, task-\d{2})*)$/;
const RE_ALCANCE = /Fuera de alcance:\s*\S/;
const RE_PASO = /^\d+\. /;
const RE_PENDIENTE = /\b(TBD|a definir|según corresponda)\b/i;

// Divide las líneas en secciones `## `, ignorando las líneas dentro de bloques de código.
export function secciones(lineas) {
  const resultado = [];
  let enCodigo = false;
  let actual = null;
  for (const linea of lineas) {
    if (/^```/.test(linea)) {
      enCodigo = !enCodigo;
    } else if (!enCodigo && linea.startsWith('## ')) {
      actual = { titulo: linea.slice(3).trim(), lineas: [] };
      resultado.push(actual);
      continue;
    }
    if (actual) actual.lineas.push(linea);
  }
  return resultado;
}

export function validarTarea(texto) {
  const errores = [];
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const lineas = todo.split('\n');

  // Regla 1: primera línea.
  if (!RE_PRIMERA.test(lineas[0] ?? '')) {
    errores.push('La primera línea debe tener la forma «# task-NN — título».');
  }

  // Regla 2: segunda línea (repo, depende_de, estado).
  const segunda = RE_SEGUNDA.exec(lineas[1] ?? '');
  if (!segunda) {
    errores.push('La segunda línea debe tener la forma «repo: … depende_de: … estado: …», separada por tres espacios, con un estado válido.');
  } else if (!RE_DEPENDE.test(segunda[2])) {
    errores.push(`«depende_de» debe ser «—» o una lista «task-NN» separada por «, »; hay «${segunda[2]}».`);
  }
  const estado = segunda?.[3];

  // Regla 3: las diez secciones `##`, exactas y en orden.
  const encontradas = secciones(lineas);
  const titulos = encontradas.map((s) => s.titulo);
  const enOrden = titulos.length === SECCIONES.length && titulos.every((t, i) => t === SECCIONES[i]);
  if (!enOrden) {
    errores.push(`Las secciones «##» deben ser exactamente estas ${SECCIONES.length}, en este orden: ${SECCIONES.join(', ')}. Hay: ${titulos.join(', ') || 'ninguna'}.`);
  }

  const bloque = (nombre) => encontradas.find((s) => s.titulo === nombre)?.lineas ?? [];
  const cuerpo = (nombre) => bloque(nombre).join('\n').trim();

  for (const nombre of SECCIONES) {
    if (!titulos.includes(nombre)) {
      errores.push(`Falta la sección «## ${nombre}».`);
      continue;
    }
    // Regla 4: cuerpo no vacío salvo Evidencia y Notas.
    if (!SECCIONES_LIBRES.includes(nombre) && cuerpo(nombre) === '') {
      errores.push(`La sección «## ${nombre}» no tiene cuerpo.`);
    }
  }

  // Regla 4 (continuación): Evidencia no vacía si la tarea está lista para revisión o hecha.
  if (ESTADOS_QUE_EXIGEN_EVIDENCIA.includes(estado) && cuerpo('Evidencia') === '') {
    errores.push(`«Evidencia» no puede estar vacía con estado «${estado}».`);
  }

  // Regla 5: Alcance / Fuera de alcance.
  if (titulos.includes('Alcance / Fuera de alcance') && !RE_ALCANCE.test(cuerpo('Alcance / Fuera de alcance'))) {
    errores.push('«Alcance / Fuera de alcance» debe contener «Fuera de alcance:» seguido de texto.');
  }

  // Regla 6: entre 1 y 8 pasos numerados.
  const pasos = bloque('Pasos').filter((l) => RE_PASO.test(l)).length;
  if (pasos < 1 || pasos > 8) {
    errores.push(`«Pasos» debe tener entre 1 y 8 líneas numeradas; tiene ${pasos}.`);
  }

  // Regla 7: entre 1 y 5 criterios numerados.
  const criterios = bloque('Criterios de aceptación').filter((l) => RE_PASO.test(l)).length;
  if (criterios < 1 || criterios > 5) {
    errores.push(`«Criterios de aceptación» debe tener entre 1 y 5 líneas numeradas; tiene ${criterios}.`);
  }

  // Regla 8: sin marcadores de pendiente fuera de bloques de código ni de comillas invertidas.
  const sinCodigo = todo.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  if (RE_PENDIENTE.test(sinCodigo)) {
    errores.push('Hay un marcador de pendiente («TBD», «a definir» o «según corresponda») fuera de bloques de código.');
  }

  // Regla 9: largo máximo de la tarea en caracteres (8 KB).
  if (todo.length > MAX_CARACTERES) {
    errores.push(`La tarea mide ${todo.length} caracteres; el máximo es ${MAX_CARACTERES} (8 KB).`);
  }

  // Regla 10: «Decisiones abiertas» es «Ninguna» o solo decisiones con «Resuelta: texto».
  if (titulos.includes('Decisiones abiertas')) {
    const abiertas = cuerpo('Decisiones abiertas');
    const lineasAbiertas = bloque('Decisiones abiertas').map((l) => l.trim()).filter((l) => l !== '');
    const soloResueltas = lineasAbiertas.length > 0 && lineasAbiertas.every((l) => /^- .*Resuelta:\s+\S/.test(l));
    if (abiertas !== 'Ninguna' && abiertas !== 'Ninguna.' && !soloResueltas) {
      errores.push('«Decisiones abiertas» debe ser «Ninguna» o cada línea «- … Resuelta: texto»; hay decisiones sin resolver o la sección está vacía.');
    }
  }

  // Regla 11: «Contexto» tiene exactamente una línea «- Tocar: », con 1 a 3 rutas relativas y exactas.
  const lineasTocar = bloque('Contexto').filter((l) => l.startsWith('- Tocar: '));
  if (lineasTocar.length !== 1) {
    errores.push(`«Contexto» debe tener exactamente una línea «- Tocar: …»; tiene ${lineasTocar.length}.`);
  } else {
    const valor = lineasTocar[0].slice('- Tocar: '.length);
    if (!/^`[^`\s]+`(, `[^`\s]+`)*$/.test(valor)) {
      errores.push('«Tocar» debe listar las rutas entre comillas invertidas, separadas por «, ».');
    } else {
      const rutas = [...valor.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      if (rutas.length < 1 || rutas.length > 3) {
        errores.push(`«Tocar» debe tener entre 1 y 3 rutas; tiene ${rutas.length}.`);
      }
      for (const ruta of rutas) {
        const valida = /^[A-Za-z0-9_.\-\/]+$/.test(ruta) && !ruta.includes('..') && !ruta.startsWith('/') && !ruta.endsWith('/');
        if (!valida) {
          errores.push(`«Tocar» tiene una ruta no válida: «${ruta}». Debe ser relativa al repo, sin «*» ni «..», sin «/» al inicio ni al final.`);
        }
      }
    }
  }

  // Regla 12: «- Requiere:» es opcional (ausente = «ninguno»); si aparece, una sola línea bien formada en «Contexto».
  const requiere = extraerRequiere(todo);
  if (requiere.estado === 'multiple') {
    errores.push('«Contexto» tiene más de una línea «- Requiere: …»; debe tener como máximo una.');
  } else if (requiere.estado === 'presente') {
    const analisis = parsearRequiere(requiere.valor);
    if (!analisis.ok) {
      errores.push(analisis.error);
    }
  }

  return errores;
}
