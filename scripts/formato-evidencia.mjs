// Núcleo que comprueba la sección «Evidencia» de una tarea contra su «Verificación» y su «Notas» (task-01 de F25).
// validarEvidencia(texto) devuelve un arreglo de motivos de rechazo en español; vacío = válida.
// Función pura: no escribe archivos, no usa red ni git.

import { secciones } from './formato-tarea.mjs';

const ESTADOS_NO_TERMINADOS = ['borrador', 'aprobada', 'en curso'];
const ESTADOS_TERMINADOS = ['lista para revisión', 'hecha'];
const RE_ESTADO = /estado: (borrador|aprobada|en curso|lista para revisión|hecha|bloqueada)\s*$/;
// TBD, TODO y PENDIENTE: solo en mayúsculas y como palabra completa («todo» es palabra común y node:test imprime «ℹ todo 0»).
const RE_PENDIENTE_MAYUSCULAS = /(?<![\p{L}\p{N}_])(TBD|TODO|PENDIENTE)(?![\p{L}\p{N}_])/gu;
// Estas tres sin distinguir mayúsculas, como palabra completa.
const RE_PENDIENTE_LIBRE = /(?<![\p{L}\p{N}_])(a definir|según corresponda|no ejecutado)(?![\p{L}\p{N}_])/giu;
const RE_REGISTRO = /^Registro: n=(\d+); herramienta=(\S+); modo=(\S+); intentos=(\d+); verificacion=(\S+); huecos=(\d+); resultado=(\S+); causa=(\S+)$/;

// Líneas dentro de cada bloque de código (sin las cercas ```).
function bloquesDeCodigo(lineas) {
  const bloques = [];
  let actual = null;
  for (const linea of lineas) {
    if (/^```/.test(linea)) {
      if (actual) {
        bloques.push(actual);
        actual = null;
      } else {
        actual = [];
      }
    } else if (actual) {
      actual.push(linea);
    }
  }
  if (actual) bloques.push(actual);
  return bloques;
}

// Líneas fuera de bloques de código.
function fueraDeCodigo(lineas) {
  const resultado = [];
  let enCodigo = false;
  for (const linea of lineas) {
    if (/^```/.test(linea)) enCodigo = !enCodigo;
    else if (!enCodigo) resultado.push(linea);
  }
  return resultado;
}

// Registros «$ comando» de Evidencia: cada uno con la salida hasta el siguiente «$ » o el fin del bloque.
function registrosDeEvidencia(lineas) {
  const registros = [];
  for (const bloque of bloquesDeCodigo(lineas)) {
    let actual = null;
    for (const linea of bloque) {
      if (linea.startsWith('$ ')) {
        actual = { comando: linea.trimEnd(), salida: [] };
        registros.push(actual);
      } else if (actual) {
        actual.salida.push(linea);
      }
    }
  }
  return registros;
}

export function validarEvidencia(texto) {
  const errores = [];
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const lineas = todo.split('\n');

  const estado = lineas[1]?.match(RE_ESTADO)?.[1];
  if (!estado) {
    errores.push('La segunda línea debe terminar en un «estado:» válido.');
  }
  if (ESTADOS_NO_TERMINADOS.includes(estado)) {
    errores.push(`La tarea no está terminada: estado «${estado}».`);
    return errores;
  }

  const encontradas = secciones(lineas);
  const bloque = (nombre) => encontradas.find((s) => s.titulo === nombre)?.lineas ?? [];
  const verificacion = bloque('Verificación');
  const evidencia = bloque('Evidencia');
  const notas = bloque('Notas');

  // Comandos de Verificación: líneas no vacías, sin «#», dentro de bloques de código.
  const comandos = bloquesDeCodigo(verificacion)
    .flat()
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'));
  if (comandos.length === 0) {
    errores.push('«Verificación» no tiene comandos dentro de bloques de código.');
  }

  // Líneas «Esperado» de Verificación (fuera de bloques de código).
  const lineasEsperado = fueraDeCodigo(verificacion).filter((l) => /esperad/i.test(l));

  const textoEvidencia = evidencia.join('\n');
  const registros = registrosDeEvidencia(evidencia);

  for (const cmd of comandos) {
    const reg = registros.find((r) => r.comando === `$ ${cmd}`);
    if (!reg) {
      errores.push(`Falta la salida del comando «${cmd}» en «Evidencia» (línea «$ ${cmd}» dentro de un bloque de código).`);
      continue;
    }
    const salida = reg.salida.map((l) => l.trim());
    if (!salida.some((l) => l !== '')) {
      errores.push(`La salida del comando «${cmd}» en «Evidencia» está vacía.`);
      continue;
    }
    // Solo se exige la línea «exit N»; el valor lo juzgan los fragmentos de «Esperado».
    if (!salida.some((l) => /^exit \d+$/.test(l))) {
      errores.push(`Falta la línea «exit N» del comando «${cmd}» en «Evidencia».`);
    }
  }

  // Fragmentos entre comillas invertidas de las líneas «esperad…» deben aparecer literales en Evidencia.
  const fragmentos = lineasEsperado.flatMap((l) => [...l.matchAll(/`([^`]+)`/g)].map((m) => m[1]));
  for (const fragmento of fragmentos) {
    if (!textoEvidencia.includes(fragmento)) {
      errores.push(`El fragmento esperado «${fragmento}» no aparece literal en «Evidencia».`);
    }
  }

  // Marcadores pendientes en Evidencia, uno por clase.
  const pendientes = [
    ...new Set([
      ...[...textoEvidencia.matchAll(RE_PENDIENTE_MAYUSCULAS)].map((m) => m[1]),
      ...[...textoEvidencia.matchAll(RE_PENDIENTE_LIBRE)].map((m) => m[1].toLowerCase()),
    ]),
  ];
  for (const marcador of pendientes) {
    errores.push(`«Evidencia» contiene el marcador pendiente «${marcador}».`);
  }

  // Línea de registro: última línea no vacía de «Notas».
  const noVacias = notas.map((l) => l.trim()).filter((l) => l !== '');
  const ultima = noVacias.at(-1) ?? '';
  const total = noVacias.filter((l) => l.startsWith('Registro:')).length;
  const campos = RE_REGISTRO.exec(ultima);
  if (!ultima.startsWith('Registro:')) {
    errores.push('La última línea no vacía de «Notas» debe ser «Registro: …».');
  } else if (!campos) {
    errores.push('La línea «Registro:» debe tener los 8 campos en este orden: n, herramienta, modo, intentos, verificacion, huecos, resultado, causa.');
  } else {
    const [, n, , , intentos, verif, , resultado, causa] = campos;
    if (Number(n) !== total) {
      errores.push(`«Registro» dice n=${n}, pero «Notas» tiene ${total} línea(s) «Registro:».`);
    }
    if (ESTADOS_TERMINADOS.includes(estado)) {
      const exigidos = [
        ['resultado', resultado, 'lista'],
        ['causa', causa, 'ninguna'],
        ['verificacion', verif, 'pasa'],
      ];
      for (const [campo, valor, esperado] of exigidos) {
        if (valor !== esperado) {
          errores.push(`«Registro» incoherente con el estado «${estado}»: exige ${campo}=${esperado}; hay ${campo}=${valor}.`);
        }
      }
      if (Number(intentos) < 1) {
        errores.push(`«Registro» incoherente con el estado «${estado}»: exige intentos≥1; hay intentos=${intentos}.`);
      }
    } else if (estado === 'bloqueada' && !['bloqueada', 'escalada'].includes(resultado)) {
      errores.push(`«Registro» incoherente con el estado «bloqueada»: exige resultado=bloqueada o escalada; hay resultado=${resultado}.`);
    }
  }

  return errores;
}
