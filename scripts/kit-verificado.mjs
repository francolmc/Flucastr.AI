// Verificación ya hecha: dice si el árbol del repo ya pasó `./verify` sin cambios desde entonces.
// Uso:
//   node scripts/kit-verificado.mjs estado --nivel <rapida|servicio|aceptacion> [--carpeta <raíz>]
//   node scripts/kit-verificado.mjs iniciar [--carpeta <raíz>]
//   node scripts/kit-verificado.mjs cerrar --nivel <n> --fase <texto> --ok <true|false> --fallo <ninguno|entorno|dependencia|prueba|tiempo> --huella-inicio <hex> [--carpeta <raíz>]
// estado: 0 ya verificado; 1 verificar (motivo=...); 3 el mismo árbol ya falló; 2 uso.
// iniciar: borra el resultado anterior y muestra la huella de inicio (0), o 1 si no hay huella.
// cerrar: escribe pruebas/.temporales/resultado.json solo si el árbol no cambió desde iniciar (0).
// Contrato: core/contracts/verification.md, «Verificación ya hecha». La huella es core/skills/diagnose/fingerprint.mjs.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fingerprintCurrent } from '../core/skills/diagnose/fingerprint.mjs';

const NIVELES = ['rapida', 'servicio', 'aceptacion'];
const FALLOS = ['ninguno', 'entorno', 'dependencia', 'prueba', 'tiempo'];
const RESULTADO = path.join('pruebas', '.temporales', 'resultado.json');
const HUELLA = /^[0-9a-f]{12}$/;

function rutaResultado(carpeta) {
  return path.join(carpeta, RESULTADO);
}

// Lee el resultado. Solo acepta el esquema completo; la clave antigua `huella` se lee como fingerprint, nunca se escribe.
// Una combinación incoherente (ok true con fallo, o ok false sin fallo) cuenta como inválido.
function leerResultado(carpeta) {
  const ruta = rutaResultado(carpeta);
  if (!existsSync(ruta)) return { estado: 'no_existe' };
  let o;
  try {
    o = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch {
    return { estado: 'invalido' };
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { estado: 'invalido' };
  const fingerprint = o.fingerprint ?? o.huella;
  const valido =
    typeof fingerprint === 'string' && HUELLA.test(fingerprint) &&
    NIVELES.includes(o.level) &&
    typeof o.fase === 'string' && o.fase.length > 0 &&
    typeof o.ok === 'boolean' &&
    FALLOS.includes(o.fallo) &&
    (o.ok ? o.fallo === 'ninguno' : o.fallo !== 'ninguno');
  if (!valido) return { estado: 'invalido' };
  return { estado: 'valido', datos: { fingerprint, level: o.level, fase: o.fase, ok: o.ok, fallo: o.fallo } };
}

// Decide si el árbol ya está verificado. Devuelve { codigo, motivo?, huella?, fase?, fallo? }.
export function yaVerificado({ carpeta, nivel }) {
  const huella = fingerprintCurrent(carpeta);
  if (huella === null) return { codigo: 1, motivo: 'sin_huella' };
  const r = leerResultado(carpeta);
  if (r.estado === 'no_existe') return { codigo: 1, motivo: 'sin_resultado', huella };
  if (r.estado === 'invalido') return { codigo: 1, motivo: 'invalido', huella };
  const d = r.datos;
  if (d.fingerprint !== huella) return { codigo: 1, motivo: 'huella_distinta', huella };
  if (!d.ok) return { codigo: 3, motivo: 'fallo_previo', huella, fase: d.fase, fallo: d.fallo };
  if (NIVELES.indexOf(d.level) < NIVELES.indexOf(nivel)) return { codigo: 1, motivo: 'nivel_menor', huella };
  return { codigo: 0, huella, fase: d.fase, nivel: d.level };
}

// Borra el resultado anterior y devuelve la huella con la que empieza la corrida.
export function iniciar({ carpeta }) {
  const huella = fingerprintCurrent(carpeta);
  if (huella === null) return { codigo: 1, motivo: 'sin_huella' };
  rmSync(rutaResultado(carpeta), { force: true });
  return { codigo: 0, huella };
}

// Registra el resultado. Nunca escribe si la combinación es incoherente o si el árbol cambió desde iniciar.
export function cerrar({ carpeta, nivel, fase, ok, fallo, huellaInicio }) {
  if (!NIVELES.includes(nivel) || !fase || (ok !== true && ok !== false) || !FALLOS.includes(fallo) ||
      (ok ? fallo !== 'ninguno' : fallo === 'ninguno') || !HUELLA.test(huellaInicio ?? '')) {
    return { codigo: 2, motivo: 'uso' };
  }
  const huella = fingerprintCurrent(carpeta);
  if (huella === null) return { codigo: 1, motivo: 'sin_huella' };
  if (huella !== huellaInicio) return { codigo: 1, motivo: 'huella_cambio', huella };
  const ruta = rutaResultado(carpeta);
  mkdirSync(path.dirname(ruta), { recursive: true });
  const tmp = `${ruta}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify({ fingerprint: huella, level: nivel, fase, ok, fallo }) + '\n');
  renameSync(tmp, ruta);
  return { codigo: 0, huella };
}

function leerArgs(argv) {
  const [orden, ...resto] = argv;
  const opciones = { carpeta: [] };
  const claves = { '--nivel': 'nivel', '--fase': 'fase', '--ok': 'ok', '--fallo': 'fallo', '--huella-inicio': 'huellaInicio', '--carpeta': 'carpeta' };
  for (let i = 0; i < resto.length; i += 2) {
    const clave = claves[resto[i]];
    if (!clave || resto[i + 1] === undefined || resto[i + 1].startsWith('--')) return null;
    if (clave === 'carpeta') opciones.carpeta.push(path.resolve(resto[i + 1]));
    else opciones[clave] = resto[i + 1];
  }
  if (opciones.ok !== undefined) {
    if (opciones.ok !== 'true' && opciones.ok !== 'false') return null;
    opciones.ok = opciones.ok === 'true';
  }
  return { orden, opciones };
}

function main(argv) {
  const parseado = leerArgs(argv);
  if (!parseado || !['estado', 'iniciar', 'cerrar'].includes(parseado.orden)) {
    console.error('uso: kit-verificado.mjs estado|iniciar|cerrar [opciones]');
    return 2;
  }
  const { orden, opciones } = parseado;
  if (opciones.carpeta.length > 1) {
    console.log('verificar: motivo=multi_repo');
    return 1;
  }
  const carpeta = opciones.carpeta[0] ?? process.cwd();

  if (orden === 'estado') {
    const nivel = opciones.nivel ?? 'aceptacion';
    if (!NIVELES.includes(nivel)) {
      console.error('kit-verificado: --nivel debe ser rapida, servicio o aceptacion');
      return 2;
    }
    const r = yaVerificado({ carpeta, nivel });
    if (r.huella) console.log(`Fingerprint: ${r.huella}`);
    if (r.codigo === 0) console.log(`ya verificado: nivel=${r.nivel} fase=${r.fase}`);
    else if (r.codigo === 3) console.log(`fallo previo en este mismo árbol (fase=${r.fase}, fallo=${r.fallo}): no relanzar la verificación; corregir antes. motivo=${r.motivo}`);
    else console.log(`verificar: motivo=${r.motivo}`);
    return r.codigo;
  }

  if (orden === 'iniciar') {
    const r = iniciar({ carpeta });
    if (r.codigo === 0) console.log(`Fingerprint: ${r.huella}`);
    else console.log(`verificar: motivo=${r.motivo}`);
    return r.codigo;
  }

  const r = cerrar({ carpeta, nivel: opciones.nivel, fase: opciones.fase, ok: opciones.ok, fallo: opciones.fallo, huellaInicio: opciones.huellaInicio });
  if (r.codigo === 0) console.log(`resultado registrado: Fingerprint: ${r.huella}`);
  else if (r.codigo === 2) console.error('kit-verificado: argumentos de cerrar inválidos o incoherentes (ok true exige fallo ninguno; ok false exige otro fallo)');
  else console.log(`no se registra: motivo=${r.motivo}`);
  return r.codigo;
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  process.exitCode = main(process.argv.slice(2));
}
