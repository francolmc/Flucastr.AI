// Núcleo que comprueba la sección «Evidencia» de una tarea contra su «Verificación» y su «Notas» (task-01 de F25).
// validarEvidencia(texto) devuelve un arreglo de motivos de rechazo en español; vacío = válida.
// Función pura: no escribe archivos, no usa red ni git.

import { secciones } from './formato-tarea.mjs';
import { lineasDeNotas, parsearBloqueo, parsearCancelada, coherenciaBloqueo } from './formato-bloqueo.mjs';

const ESTADOS_NO_TERMINADOS = ['borrador', 'aprobada', 'en curso'];
const ESTADOS_TERMINADOS = ['lista para revisión', 'hecha'];
const RE_ESTADO = /estado: (borrador|aprobada|en curso|lista para revisión|hecha|bloqueada|cancelada)\s*$/;
// TBD, TODO y PENDIENTE: solo en mayúsculas y como palabra completa («todo» es palabra común y node:test imprime «ℹ todo 0»).
const RE_PENDIENTE_MAYUSCULAS = /(?<![\p{L}\p{N}_])(TBD|TODO|PENDIENTE)(?![\p{L}\p{N}_])/gu;
// Estas tres sin distinguir mayúsculas, como palabra completa.
const RE_PENDIENTE_LIBRE = /(?<![\p{L}\p{N}_])(a definir|según corresponda|no ejecutado)(?![\p{L}\p{N}_])/giu;
const RE_REGISTRO = /^Registro: n=(\d+); herramienta=(\S+); modo=(\S+); intentos=(\d+); verificacion=(\S+); huecos=(\d+); resultado=(\S+); causa=(\S+)$/;

// Coherencia de las claves de «Registro:» (task-02 de F30). Función pura: devuelve motivos en español; vacío = coherente.
// Cada regla se omite si sus claves vienen undefined, así que la puede llamar registrar.mjs sin estado ni intentos.
export function coherenciaRegistro({ estado, verificacion, resultado, causa, intentos } = {}) {
  const motivos = [];
  const definido = (valor) => valor !== undefined;
  const v = (valor) => (valor === undefined ? '(sin dato)' : valor);

  // Regla 1: con estado terminado, resultado=lista, causa=ninguna, verificacion=pasa e intentos>=1.
  if (ESTADOS_TERMINADOS.includes(estado)) {
    const exigidos = [
      ['resultado', resultado, 'lista'],
      ['causa', causa, 'ninguna'],
      ['verificacion', verificacion, 'pasa'],
    ];
    for (const [campo, valor, esperado] of exigidos) {
      if (definido(valor) && valor !== esperado) {
        motivos.push(`«Registro» incoherente con el estado «${estado}»: exige ${campo}=${esperado}; hay ${campo}=${valor}.`);
      }
    }
    if (definido(intentos) && Number(intentos) < 1) {
      motivos.push(`«Registro» incoherente con el estado «${estado}»: exige intentos≥1; hay intentos=${intentos}.`);
    }
  } else if (estado === 'bloqueada' && definido(resultado) && !['bloqueada', 'escalada'].includes(resultado)) {
    // Regla 2: con estado bloqueada, resultado es bloqueada o escalada.
    motivos.push(`«Registro» incoherente con el estado «bloqueada»: exige resultado=bloqueada o escalada; hay resultado=${resultado}.`);
  }

  // Regla 3: causa=verificacion_x2 exige resultado=bloqueada e intentos=2.
  if (causa === 'verificacion_x2' && ((definido(resultado) && resultado !== 'bloqueada') || (definido(intentos) && Number(intentos) !== 2))) {
    motivos.push(`«Registro» incoherente: causa=verificacion_x2 exige resultado=bloqueada e intentos=2; hay resultado=${v(resultado)} e intentos=${v(intentos)}.`);
  }

  // Regla 4: causa=parcial exige resultado=bloqueada.
  if (causa === 'parcial' && definido(resultado) && resultado !== 'bloqueada') {
    motivos.push(`«Registro» incoherente: causa=parcial exige resultado=bloqueada; hay resultado=${resultado}.`);
  }

  // Regla 5: sin estado, resultado=lista exige verificacion=pasa y causa=ninguna.
  if (estado === undefined && resultado === 'lista') {
    if (definido(verificacion) && verificacion !== 'pasa') {
      motivos.push(`«Registro» incoherente: resultado=lista exige verificacion=pasa; hay verificacion=${verificacion}.`);
    }
    if (definido(causa) && causa !== 'ninguna') {
      motivos.push(`«Registro» incoherente: resultado=lista exige causa=ninguna; hay causa=${causa}.`);
    }
  }

  // Mensajes: dicen el valor correcto cuando verificacion no es pasa.
  if (verificacion === 'parcial' && definido(resultado) && resultado !== 'bloqueada') {
    motivos.push('«Registro» incoherente: con verificacion=parcial usa resultado=bloqueada; causa=parcial.');
  }
  if (verificacion === 'falla' && resultado === 'lista') {
    motivos.push('«Registro» incoherente: con verificacion=falla usa resultado=bloqueada.');
  }

  return [...new Set(motivos)];
}

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

  // Cancelada (F32, task-02): estado final sin evidencia de verificación; solo exige su línea «Cancelada:».
  if (estado === 'cancelada') {
    const lineasCancelada = lineasDeNotas(todo, 'Cancelada:');
    if (lineasCancelada.length !== 1) {
      if (lineasCancelada.length === 0) {
        errores.push('Una tarea «cancelada» exige una línea «Cancelada: motivo=…» en «Notas».');
      } else {
        errores.push(`Una tarea «cancelada» exige una sola línea «Cancelada: motivo=…» en «Notas»; hay ${lineasCancelada.length}.`);
      }
    } else {
      const cancelada = parsearCancelada(lineasCancelada[0]);
      if (!cancelada.ok) errores.push(cancelada.error);
    }
    return [...new Set(errores)];
  }

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

  // Líneas «Bloqueo:» (F32, task-02; opcionales): formato, posición antes de «Registro:» y coherencia con su causa.
  // lineasDeNotas(todo, '') da las líneas de Notas fuera de código, en orden, con sus vacías.
  const enNotas = lineasDeNotas(todo, '');
  const indiceUltimoRegistro = enNotas.reduce((ultimo, l, i) => (l.startsWith('Registro:') ? i : ultimo), -1);
  enNotas.forEach((linea, i) => {
    if (!linea.startsWith('Bloqueo:')) return;
    const bloqueo = parsearBloqueo(linea);
    if (!bloqueo.ok) {
      errores.push(bloqueo.error);
      return;
    }
    if (indiceUltimoRegistro !== -1 && i > indiceUltimoRegistro) {
      errores.push('La línea «Bloqueo:» debe ir antes de «Registro:».');
    }
    const siguiente = enNotas.slice(i + 1).find((l) => l.startsWith('Registro:'));
    const causaSiguiente = RE_REGISTRO.exec(siguiente ?? '')?.[8];
    errores.push(...coherenciaBloqueo({ tipo: bloqueo.tipo, causa: causaSiguiente }));
  });

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
    errores.push(...coherenciaRegistro({ estado, verificacion: verif, resultado, causa, intentos }));
  }

  return [...new Set(errores)];
}
