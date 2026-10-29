// Validadores deterministas de la estructura de BACKLOG.md y STATUS.md (definitions/WORKFLOW.md §3 y §4).
// validarBacklog(texto) y validarStatus(texto) devuelven un arreglo de mensajes de error en español; vacío = válido. No lanzan.

const CABECERA_BACKLOG = [
  'ID',
  'Feature',
  'Tipo (habilitante / producto)',
  'Valor',
  'Esfuerzo',
  'Por qué en esta posición',
  'Estado',
  'Siguiente',
];
const TIPOS = ['habilitante', 'producto'];
const ESTADOS_BACKLOG = ['pendiente', 'en curso', 'hecha'];
const SECCIONES_STATUS = ['Escalación', 'Paso actual', 'Espera a Franco', 'Bloqueos abiertos', 'Última actualización'];
const SECCIONES_CON_CUERPO = ['Paso actual', 'Espera a Franco', 'Bloqueos abiertos', 'Última actualización'];

const RE_FILA_DATOS = /^\| F\d{2} \|/;
const RE_SEPARADOR = /^\|(\s*-{3,}\s*\|)+\s*$/;
const RE_ESTADO_DOC = /^Estado del documento: (borrador|aprobado)\s*$/m;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}\s*$/m;

function celdas(linea) {
  return linea.split('|').slice(1, -1).map((c) => c.trim());
}

export function validarBacklog(texto) {
  const errores = [];
  const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n');

  // Regla 1: fila de encabezado exacta seguida de separador.
  const iCabecera = lineas.findIndex((l) => {
    if (!l.startsWith('|')) return false;
    const c = celdas(l);
    return c.length === CABECERA_BACKLOG.length && c.every((v, i) => v === CABECERA_BACKLOG[i]);
  });
  if (iCabecera === -1) {
    errores.push(`Falta la fila de encabezado exacta: ${CABECERA_BACKLOG.join(' | ')}.`);
  } else if (!RE_SEPARADOR.test(lineas[iCabecera + 1] ?? '')) {
    errores.push('La fila de encabezado debe seguirse de una fila separadora «|---|…».');
  }

  // Regla 2: entre 1 y 6 filas de datos, cada una con 8 celdas, IDs únicos.
  const filas = lineas.filter((l) => RE_FILA_DATOS.test(l));
  if (filas.length < 1 || filas.length > 6) {
    errores.push(`La tabla debe tener entre 1 y 6 features; tiene ${filas.length}.`);
  }
  const ids = new Set();
  const datos = [];
  for (const fila of filas) {
    const c = celdas(fila);
    if (c.length !== CABECERA_BACKLOG.length) {
      errores.push(`La fila «${c[0] ?? fila}» debe tener ${CABECERA_BACKLOG.length} celdas; tiene ${c.length}.`);
      continue;
    }
    if (ids.has(c[0])) errores.push(`El ID «${c[0]}» aparece más de una vez.`);
    ids.add(c[0]);
    datos.push(c);

    // Regla 3: valores de Tipo, Estado y Siguiente.
    if (!TIPOS.includes(c[2])) {
      errores.push(`${c[0]}: «Tipo» debe ser habilitante o producto; es «${c[2]}».`);
    }
    if (!ESTADOS_BACKLOG.includes(c[6])) {
      errores.push(`${c[0]}: «Estado» debe ser pendiente, en curso o hecha; es «${c[6]}».`);
    }
    if (c[7] !== '' && c[7] !== '→') {
      errores.push(`${c[0]}: «Siguiente» debe ser vacío o «→»; es «${c[7]}».`);
    }
  }

  // Regla 4: un único → en la primera fila no hecha; ninguno si todas están hechas.
  const primeraNoHecha = datos.findIndex((c) => c[6] !== 'hecha');
  const marcadas = datos.map((c, i) => (c[7] === '→' ? i : -1)).filter((i) => i !== -1);
  if (primeraNoHecha === -1) {
    if (marcadas.length > 0) {
      errores.push('Todas las features están hechas: no debe haber ningún «→».');
    }
  } else if (marcadas.length !== 1) {
    errores.push(`Debe haber exactamente un «→»; hay ${marcadas.length}.`);
  } else if (marcadas[0] !== primeraNoHecha) {
    errores.push(`El «→» debe estar en ${datos[primeraNoHecha][0]}, la primera feature que no está hecha; está en ${datos[marcadas[0]][0]}.`);
  }

  // Regla 5: línea de estado del documento.
  if (!RE_ESTADO_DOC.test(String(texto))) {
    errores.push('Falta la línea «Estado del documento: borrador» o «Estado del documento: aprobado».');
  }

  return errores;
}

// Divide el texto en secciones `## ` y devuelve { titulo, cuerpo } en orden.
function seccionesStatus(lineas) {
  const resultado = [];
  let actual = null;
  for (const linea of lineas) {
    if (linea.startsWith('## ')) {
      actual = { titulo: linea.slice(3).trim(), lineas: [] };
      resultado.push(actual);
    } else if (actual) {
      actual.lineas.push(linea);
    }
  }
  return resultado.map((s) => ({ titulo: s.titulo, cuerpo: s.lineas.join('\n').trim() }));
}

export function validarStatus(texto) {
  const errores = [];
  const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n');

  // Regla 1: título.
  if (lineas[0] !== '# Estado del flujo') {
    errores.push('La primera línea debe ser «# Estado del flujo».');
  }

  // Regla 2: secciones `##` exactas y en orden.
  const secciones = seccionesStatus(lineas);
  const titulos = secciones.map((s) => s.titulo);
  const enOrden = titulos.length === SECCIONES_STATUS.length && titulos.every((t, i) => t === SECCIONES_STATUS[i]);
  if (!enOrden) {
    errores.push(`Las secciones «##» deben ser exactamente estas, en este orden: ${SECCIONES_STATUS.join(', ')}. Hay: ${titulos.join(', ') || 'ninguna'}.`);
  }

  const cuerpo = (nombre) => secciones.find((s) => s.titulo === nombre)?.cuerpo ?? '';

  // Regla 3: cuerpo no vacío salvo Escalación.
  for (const nombre of SECCIONES_CON_CUERPO) {
    if (titulos.includes(nombre) && cuerpo(nombre) === '') {
      errores.push(`La sección «## ${nombre}» no tiene cuerpo.`);
    }
  }

  // Regla 4: fecha de Última actualización.
  if (titulos.includes('Última actualización') && !RE_FECHA.test(cuerpo('Última actualización'))) {
    errores.push(`«Última actualización» debe contener una fecha YYYY-MM-DD; es «${cuerpo('Última actualización')}».`);
  }

  return errores;
}
