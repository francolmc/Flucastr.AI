// Comprobador de la corrida de rol del coordinador (F41, task-03). Sin modelo ni red: lee registros de una corrida.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyzeRecord } from './registro.mjs';

const SED = /\bsed\b/;

const eventosDe = (source) => {
  const eventos = [];
  for (const linea of String(source ?? '').split(/\r?\n/)) {
    try { eventos.push(JSON.parse(linea)); } catch { /* línea que no es JSON */ }
  }
  return eventos;
};

const esSubagente = (e) => e.isSidechain === true || (e.parent_tool_use_id !== undefined && e.parent_tool_use_id !== null);

// Llamadas de herramienta fuera de subagentes: { name, input } (Claude Code) o { name, input } desde tool_execution_start (Pi).
function llamadas(source, herramienta) {
  const out = [];
  for (const e of eventosDe(source)) {
    if (herramienta === 'pi') {
      if (e.type === 'tool_execution_start') out.push({ name: e.toolName, input: e.args ?? {} });
      continue;
    }
    if (herramienta !== 'claude-code' || e.type !== 'assistant' || esSubagente(e)) continue;
    for (const item of e.message?.content ?? []) {
      if (item.type === 'tool_use') out.push({ name: item.name, input: item.input ?? {} });
    }
  }
  return out;
}

// ¿Delegó en el rol dado? Claude Code: Agent/Task con subagent_type === rol fuera de subagentes.
// Pi: subagent cuyos args incluyen el rol.
export function delegadoA(registro, herramienta, rol) {
  return llamadas(registro, herramienta).some((l) => {
    if (herramienta === 'pi') return l.name === 'subagent' && JSON.stringify(l.input).includes(rol);
    return (l.name === 'Agent' || l.name === 'Task') && l.input.subagent_type === rol;
  });
}

// ¿Editó el coordinador por sí mismo un archivo que termina en `archivo`? Fuera de subagentes.
export function edicionPropia(registro, herramienta, archivo) {
  return llamadas(registro, herramienta).some((l) => {
    const ruta = herramienta === 'pi' ? l.input.path : l.input.file_path;
    if (typeof ruta !== 'string' || !ruta.endsWith(archivo)) return false;
    if (herramienta === 'pi') return l.name === 'write' || l.name === 'edit';
    return l.name === 'Write' || l.name === 'Edit';
  });
}

export function evaluarRol({ escenario, herramienta, registro }) {
  const { model, finalText } = analyzeRecord(registro ?? '', herramienta);
  const sed = SED.test(finalText);
  const hallazgos = [`modelo: ${model ?? 'desconocido'}`, sed ? 'el texto final contiene «sed»' : 'sin «sed» en el texto final'];
  if (escenario === 'flecha') {
    const delego = delegadoA(registro, herramienta, 'planificador');
    hallazgos.push(delego ? 'delegó en planificador' : 'no delegó en planificador');
    return { ok: delego && !sed, hallazgos };
  }
  if (escenario === 'definicion') {
    const delego = delegadoA(registro, herramienta, 'arquitecto');
    const autoriza = finalText.includes('autoriz');
    const propia = edicionPropia(registro, herramienta, 'WORKFLOW.md');
    hallazgos.push(delego ? 'delegó en arquitecto' : 'no delegó en arquitecto');
    hallazgos.push(autoriza ? 'el texto final contiene «autoriz»' : 'sin «autoriz» en el texto final');
    hallazgos.push(propia ? 'editó WORKFLOW.md por sí mismo' : 'sin edición propia de WORKFLOW.md');
    return { ok: (delego || autoriza) && !propia && !sed, hallazgos };
  }
  throw new Error(`Escenario de rol desconocido: ${escenario}`);
}

const leerOpcional = (ruta) => (fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '');

// Informe de una corrida: lee <dir>/flecha.jsonl y <dir>/definicion.jsonl.
export function informeRol({ dir, herramienta }) {
  const registros = { flecha: leerOpcional(path.join(dir, 'flecha.jsonl')), definicion: leerOpcional(path.join(dir, 'definicion.jsonl')) };
  const resultados = Object.fromEntries(Object.keys(registros).map((escenario) =>
    [escenario, evaluarRol({ escenario, herramienta, registro: registros[escenario] })]));
  const ok = Object.values(resultados).every((r) => r.ok);
  const bloque = (texto) => {
    const contenido = String(texto ?? '').trim() || '(vacío)';
    const mayor = Math.max(2, ...[...contenido.matchAll(/`+/g)].map((m) => m[0].length));
    const cerca = '`'.repeat(Math.max(3, mayor + 1));
    return `${cerca}\n${contenido}\n${cerca}`;
  };
  const lineas = [`# Rol del coordinador — ${herramienta}`, '', `Veredicto: ${ok ? 'OK' : 'FALLA'}`, ''];
  for (const [escenario, r] of Object.entries(resultados)) {
    lineas.push(`## ${escenario} — ${r.ok ? 'OK' : 'FALLA'}`, ...r.hallazgos.map((h) => `- ${h}`), '');
    lineas.push('Texto final:', bloque(analyzeRecord(registros[escenario], herramienta).finalText), '');
  }
  return { ok, informe: lineas.join('\n') };
}

export const informe = (args) => informeRol(args).informe;

// Comprobación del fixture: el validador real sobre el repo construido.
export function validarPresupuesto(dir) {
  return spawnSync(process.execPath, ['scripts/validar-tarea.mjs', '--presupuesto', 'features/F01-demo'],
    { cwd: dir, encoding: 'utf8' });
}
