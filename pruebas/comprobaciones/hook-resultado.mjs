// Comprobador de la corrida del hook del validador en Claude Code (F38, task-07). Sin modelo ni red: lee registros de una corrida.
import fs from 'node:fs';
import path from 'node:path';
import { analyzeRecord } from './registro.mjs';

const MENSAJE_BLOQUE = 'bloque de código abierto en línea';
const ESCENARIOS = ['danada', 'valida', 'subagente', 'sin-hook'];
const ARCHIVO_TAREA = path.join('features', 'F99-demo', 'task-01-x.md');
const COLA = 600;

const leerOpcional = (ruta) => (fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null);

// Modelo del primer evento system/init del registro.
function modeloDe(registro) {
  for (const linea of registro.split(/\r?\n/)) {
    try {
      const e = JSON.parse(linea);
      if (e.type === 'system' && e.subtype === 'init' && typeof e.model === 'string') return e.model;
    } catch { /* línea que no es JSON */ }
  }
  return null;
}

// Evalúa un escenario: `dir` es el directorio de los escenarios (con `<escenario>/` y `<escenario>.jsonl`).
export function evaluarEscenario({ escenario, dir, registro }) {
  if (registro === null) {
    return { ok: false, modelo: null, hallazgos: ['sin .jsonl: el escenario no se corrió'], finalText: '' };
  }
  const bloqueo = registro.includes(MENSAJE_BLOQUE);
  const modelo = modeloDe(registro);
  const { finalText } = analyzeRecord(registro, 'claude-code');
  const hallazgos = [`modelo: ${modelo ?? 'desconocido'}`,
    bloqueo ? 'el registro menciona el bloque de código abierto' : 'sin mención del bloque de código abierto'];
  let ok;
  if (escenario === 'danada') {
    ok = bloqueo;
  } else if (escenario === 'valida') {
    const existe = fs.existsSync(path.join(dir, escenario, ARCHIVO_TAREA));
    hallazgos.push(existe ? 'archivo de la tarea escrito' : 'falta el archivo de la tarea');
    ok = !bloqueo && existe;
  } else if (escenario === 'sin-hook') {
    ok = !bloqueo;
  } else if (escenario === 'subagente') {
    const llamo = /"name"\s*:\s*"(Agent|Task)"/.test(registro);
    hallazgos.push(llamo ? 'llamó a la herramienta de subagente' : 'no llamó a la herramienta de subagente');
    ok = bloqueo && llamo;
  } else {
    throw new Error(`Escenario de hook desconocido: ${escenario}`);
  }
  return { ok, modelo, hallazgos, finalText };
}

// Informe de una corrida: lee <dir>/<escenario>.jsonl de los cuatro escenarios.
export function informeHook({ dir }) {
  const resultados = Object.fromEntries(ESCENARIOS.map((escenario) =>
    [escenario, evaluarEscenario({ escenario, dir, registro: leerOpcional(path.join(dir, `${escenario}.jsonl`)) })]));
  const ok = Object.values(resultados).every((r) => r.ok);
  const modelo = Object.values(resultados).map((r) => r.modelo).find((m) => m) ?? 'desconocido';
  const bloque = (texto) => {
    const contenido = String(texto ?? '').trim() || '(vacío)';
    const mayor = Math.max(2, ...[...contenido.matchAll(/`+/g)].map((m) => m[0].length));
    const cerca = '`'.repeat(Math.max(3, mayor + 1));
    return `${cerca}\n${contenido}\n${cerca}`;
  };
  const lineas = ['# Hook del validador — claude-code', '', `Modelo: ${modelo}`, `Veredicto: ${ok ? 'OK' : 'FALLA'}`, ''];
  for (const [escenario, r] of Object.entries(resultados)) {
    lineas.push(`## ${escenario} — ${r.ok ? 'OK' : 'FALLA'}`, ...r.hallazgos.map((h) => `- ${h}`), '');
    lineas.push('Cola del texto final:', bloque(String(r.finalText).slice(-COLA)), '');
  }
  return { ok, informe: lineas.join('\n') };
}

export const informe = (args) => informeHook(args).informe;
