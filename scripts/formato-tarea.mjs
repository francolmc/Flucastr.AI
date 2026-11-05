// Núcleo del validador de la plantilla de tarea (definitions/WORKFLOW.md §6); lo usa scripts/validar-tarea.mjs y lo re-exporta pruebas/comprobaciones/formato-tarea.mjs.
// validarTarea(texto) devuelve un arreglo de mensajes de error en español; vacío = válida.

import { extraerRequiere, parsearRequiere } from './formato-requiere.mjs';
import { lineasDeNotas, parsearCancelada } from './formato-bloqueo.mjs';

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

// Regla 6: tope de pasos numerados. Las tareas `hecha` y `cancelada` conservan el tope anterior.
export const MAX_PASOS = 6;
export const MAX_PASOS_EXENTAS = 8;
const ESTADOS_EXENTOS_DE_TOPE_PASOS = ['hecha', 'cancelada'];

const SECCIONES_LIBRES = ['Evidencia', 'Notas'];
const ESTADOS_QUE_EXIGEN_EVIDENCIA = ['lista para revisión', 'hecha'];

const RE_PRIMERA = /^# task-\d{2} — \S/;
const RE_SEGUNDA = /^repo: (\S.*?) {2,}depende_de: (\S.*?) {2,}estado: (borrador|aprobada|en curso|lista para revisión|hecha|bloqueada|cancelada)\s*$/;
const RE_DEPENDE = /^(—|task-\d{2}(, task-\d{2})*)$/;
const RE_ALCANCE = /Fuera de alcance:\s*\S/;
const RE_PASO = /^\d+\. /;
const RE_PENDIENTE = /\b(TBD|a definir|según corresponda)\b/i;

// Cerca de bloque de código: 0 a 3 espacios, luego 3 o más «`» o 3 o más «~».
const RE_CERCA = /^ {0,3}(`{3,}|~{3,})(.*)$/;

function cercaDeApertura(linea) {
  const m = RE_CERCA.exec(linea);
  if (!m) return null;
  // Una apertura con «`» no puede traer «`» en el resto de la línea.
  if (m[1][0] === '`' && m[2].includes('`')) return null;
  return { caracter: m[1][0], longitud: m[1].length };
}

function esCercaDeCierre(linea, cerca) {
  const m = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(linea);
  return m !== null && m[1][0] === cerca.caracter && m[1].length >= cerca.longitud;
}

// Recorre las líneas una sola vez: secciones `## ` (fuera de bloques de código) y el bloque abierto, si queda uno.
function escanear(lineas) {
  const encontradas = [];
  let cerca = null;
  let actual = null;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (cerca) {
      if (esCercaDeCierre(linea, cerca)) cerca = null;
    } else {
      const apertura = cercaDeApertura(linea);
      if (apertura) {
        cerca = { ...apertura, linea: i + 1, seccion: actual?.titulo ?? null };
      } else if (linea.startsWith('## ')) {
        actual = { titulo: linea.slice(3).trim(), lineas: [] };
        encontradas.push(actual);
        continue;
      }
    }
    if (actual) actual.lineas.push(linea);
  }
  return {
    secciones: encontradas,
    abierta: cerca ? { linea: cerca.linea, seccion: cerca.seccion } : null,
  };
}

// Divide las líneas en secciones `## `, ignorando las líneas dentro de bloques de código.
export function secciones(lineas) {
  return escanear(lineas).secciones;
}

// null si todas las cercas cierran; si no, la línea de apertura y la sección vigente (null antes de la primera).
export function bloqueSinCerrar(lineas) {
  return escanear(lineas).abierta;
}

// Texto del error único para un bloque sin cerrar, o null.
export function mensajeBloqueSinCerrar(lineas) {
  const abierta = bloqueSinCerrar(lineas);
  if (!abierta) return null;
  if (abierta.seccion === null) {
    return `Hay un bloque de código abierto en línea ${abierta.linea}, antes de la primera sección: falta la cerca de cierre.`;
  }
  const quien = SECCIONES_LIBRES.includes(abierta.seccion) ? 'el constructor' : 'el planificador';
  return `Hay un bloque de código abierto en línea ${abierta.linea}, en «## ${abierta.seccion}» (la escribe ${quien}): falta la cerca de cierre.`;
}

// Reglas 1 a 3 (primera línea, segunda línea y secciones `##` en orden), compartidas por validarTarea y validarEstructura.
function revisarCabeceraYSecciones(lineas) {
  const errores = [];

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

  // Regla 3: las diez secciones `##`, exactas y en orden.
  const encontradas = secciones(lineas);
  const titulos = encontradas.map((s) => s.titulo);
  const enOrden = titulos.length === SECCIONES.length && titulos.every((t, i) => t === SECCIONES[i]);
  if (!enOrden) {
    errores.push(`Las secciones «##» deben ser exactamente estas ${SECCIONES.length}, en este orden: ${SECCIONES.join(', ')}. Hay: ${titulos.join(', ') || 'ninguna'}.`);
  }

  return { errores, estado: segunda?.[3], encontradas, titulos };
}

// Modo estructural (F38, task-04): solo bloque sin cerrar y reglas 1 a 3. Pensado para ejecutarse a mitad de edición:
// no evalúa cuerpos vacíos, pasos, criterios, «Tocar», tamaño ni pendientes.
export function validarEstructura(texto) {
  const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n');
  const abierto = mensajeBloqueSinCerrar(lineas);
  if (abierto) return [abierto];
  return revisarCabeceraYSecciones(lineas).errores;
}

export function validarTarea(texto) {
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const lineas = todo.split('\n');

  // Bloque de código sin cerrar: es el único error; el resto de reglas no se evalúa.
  const abierto = mensajeBloqueSinCerrar(lineas);
  if (abierto) return [abierto];

  // Reglas 1 a 3.
  const { errores, estado, encontradas, titulos } = revisarCabeceraYSecciones(lineas);

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

  // Regla 6: entre 1 y MAX_PASOS pasos numerados (MAX_PASOS_EXENTAS en hecha y cancelada).
  const maxPasos = ESTADOS_EXENTOS_DE_TOPE_PASOS.includes(estado) ? MAX_PASOS_EXENTAS : MAX_PASOS;
  const pasos = bloque('Pasos').filter((l) => RE_PASO.test(l)).length;
  if (pasos < 1 || pasos > maxPasos) {
    errores.push(`«Pasos» debe tener entre 1 y ${maxPasos} líneas numeradas; tiene ${pasos}.`);
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

  // Regla 13: «cancelada» exige exactamente una línea «Cancelada: motivo=…» en «Notas», con motivo válido.
  if (estado === 'cancelada') {
    const lineasCancelada = lineasDeNotas(todo, 'Cancelada:');
    if (lineasCancelada.length === 0) {
      errores.push('Una tarea «cancelada» exige una línea «Cancelada: motivo=…» en «Notas».');
    } else if (lineasCancelada.length > 1) {
      errores.push(`Una tarea «cancelada» debe tener exactamente una línea «Cancelada:» en «Notas»; tiene ${lineasCancelada.length}.`);
    } else {
      const analisis = parsearCancelada(lineasCancelada[0]);
      if (!analisis.ok) {
        errores.push(analisis.error);
      }
    }
  }

  return errores;
}
