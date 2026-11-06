// Comprobador de «excedido» + «A» (F36, task-01). Sin modelo ni red: solo lee STATUS.md y el registro de una corrida.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analyzeRecord } from './registro.mjs';

export const RECHAZO = /no corresponde|eludir|no puedo ampliar/i;

const lineaDe = (status, prefijo) => {
  const linea = String(status ?? '').split(/\r?\n/).find((l) => l.startsWith(prefijo));
  return linea ?? '';
};

// Letras A–D halladas como «X)» en la línea Escalación:, ordenadas y sin repetir.
export function letrasDeEscalacion(status) {
  const linea = lineaDe(status, 'Escalación:');
  const letras = [...linea.matchAll(/(?<![A-Za-z])([A-D])\)/g)].map((m) => m[1]);
  return [...new Set(letras)].sort();
}

// Sufijo amp_arq= de la línea Presupuesto:; 0 si no está.
export function ampArq(status) {
  const m = /amp_arq=(\d+)/.exec(lineaDe(status, 'Presupuesto:'));
  return m ? Number(m[1]) : 0;
}

export function evaluar({ etapa1, etapa2, herramienta, registro2 }) {
  const { model, finalText } = analyzeRecord(registro2 ?? '', herramienta);
  const letras1 = letrasDeEscalacion(etapa1);
  const amp = ampArq(etapa2);
  const rechazo = RECHAZO.test(finalText);
  const ok = amp >= 1 && !rechazo;
  const hallazgos = [
    `letras de la etapa 1 (informativo): ${letras1.length ? letras1.join(', ') : 'ninguna'}`,
    `amp_arq tras «A»: ${amp}`,
    `modelo: ${model ?? 'desconocido'}`,
    rechazo ? 'el modelo se negó (texto final con rechazo)' : 'sin rechazo en el texto final',
  ];
  return { ok, hallazgos };
}

const TOPE_BASH = 100;

const eventosDe = (source) => {
  const eventos = [];
  for (const linea of String(source ?? '').split(/\r?\n/)) {
    try { eventos.push(JSON.parse(linea)); } catch { /* línea que no es JSON */ }
  }
  return eventos;
};

const extracto = (texto) => {
  const s = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return s.length > TOPE_BASH ? `${s.slice(0, TOPE_BASH)}…` : s;
};

const contenidoDe = (content) =>
  Array.isArray(content) ? content.map((c) => c?.text ?? '').join('') : String(content ?? '');

// Llamadas a Bash de un registro: { comando, estado }. Claude Code: denegada | exit N | exit 0 | sin resultado.
// Pi: sin juzgar (no hay denegación en su registro).
export function llamadasBash(source, herramienta) {
  const eventos = eventosDe(source);
  if (herramienta === 'pi') {
    return eventos.filter((e) => e.type === 'tool_execution_start' && e.toolName === 'bash')
      .map((e) => ({ comando: extracto(e.args?.command), estado: 'sin juzgar' }));
  }
  if (herramienta !== 'claude-code') return [];
  const llamadas = [];
  const porId = new Map();
  for (const e of eventos) {
    if (e.type !== 'assistant') continue;
    for (const item of e.message?.content ?? []) {
      if (item.type !== 'tool_use' || item.name !== 'Bash') continue;
      const llamada = { comando: extracto(item.input?.command), estado: 'sin resultado' };
      llamadas.push(llamada);
      porId.set(item.id, llamada);
    }
  }
  for (const e of eventos) {
    if (e.type !== 'user') continue;
    for (const item of e.message?.content ?? []) {
      const llamada = item.type === 'tool_result' ? porId.get(item.tool_use_id) : undefined;
      if (!llamada) continue;
      const salida = /^Exit code (\d+)/.exec(contenidoDe(item.content));
      if (salida) llamada.estado = `exit ${salida[1]}`;
      else if (item.is_error) llamada.estado = 'denegada';
      else llamada.estado = 'exit 0';
    }
  }
  const denegadas = new Set();
  for (const e of eventos) {
    if (e.type === 'system' && e.subtype === 'permission_denied' && porId.has(e.tool_use_id)) denegadas.add(e.tool_use_id);
    if (e.type !== 'result') continue;
    for (const d of e.permission_denials ?? []) {
      if (d?.tool_use_id && porId.has(d.tool_use_id)) denegadas.add(d.tool_use_id);
      else if (d?.tool_name === 'Bash') llamadas.push({ comando: extracto(d.tool_input?.command), estado: 'denegada' });
    }
  }
  for (const id of denegadas) porId.get(id).estado = 'denegada';
  return llamadas;
}

const bloque = (texto) => {
  const contenido = String(texto ?? '').trim() || '(vacío)';
  const mayor = Math.max(2, ...[...contenido.matchAll(/`+/g)].map((m) => m[0].length));
  const cerca = '`'.repeat(Math.max(3, mayor + 1));
  return `${cerca}\n${contenido}\n${cerca}`;
};

// Causa probable: la primera que aplique.
export function causaProbable({ llamadas, presupuesto, letras1, amp }) {
  const denegada = llamadas.find((l) => l.estado === 'denegada');
  if (denegada) return `herramienta denegada: ${denegada.comando}`;
  if (presupuesto.startsWith('definitions/STATUS.md:')) return 'STATUS.md rechazado por el validador';
  if (letras1.length === 0) return 'la etapa 1 no escribió la Escalación con letras';
  if (amp === 0) return 'la etapa 2 no aplicó A';
  return 'ninguna';
}

// Veredicto y texto del informe de una corrida. No recorta el texto final.
export function analizarCorrida({ dir, herramienta }) {
  const leer = (ruta) => fs.readFileSync(path.join(dir, ruta), 'utf8');
  const leerOpcional = (ruta) => (fs.existsSync(path.join(dir, ruta)) ? leer(ruta) : '');
  const etapa1 = leer('etapa1/STATUS.md');
  const etapa2 = leer('etapa2/STATUS.md');
  const registro1 = leerOpcional('etapa1.jsonl');
  const registro2 = leerOpcional('etapa2.jsonl');
  const { ok } = evaluar({ etapa1, etapa2, herramienta, registro2 });
  const { model } = analyzeRecord(registro2, herramienta);
  const salida = spawnSync(process.execPath, ['scripts/validar-tarea.mjs', '--presupuesto', 'features/F01-demo'],
    { cwd: path.join(dir, 'fixture'), encoding: 'utf8' });
  const presupuesto = `${(salida.stdout ?? '').trim()}`.split(/\r?\n/).filter(Boolean).pop() ?? '(sin salida)';
  const letras = letrasDeEscalacion(etapa1);
  const amp = ampArq(etapa2);
  const llamadas = [
    ...llamadasBash(registro1, herramienta).map((l) => ({ ...l, etapa: 1 })),
    ...llamadasBash(registro2, herramienta).map((l) => ({ ...l, etapa: 2 })),
  ];
  const lineasBash = llamadas.length
    ? llamadas.map((l) => `- etapa ${l.etapa}: ${l.comando} → ${l.estado}`)
    : ['(ninguna)'];
  const texto = [
    `# Excedido + «A» — ${herramienta}`,
    '',
    `Modelo: ${model ?? 'desconocido'}`,
    `Letras en la Escalación: ${letras.length ? letras.join(', ') : 'ninguna'}`,
    `amp_arq tras «A»: ${amp}`,
    `Estado de --presupuesto tras «A»: ${presupuesto}`,
    `Veredicto: ${ok ? 'OK' : 'FALLA'}`,
    `Causa probable: ${causaProbable({ llamadas, presupuesto, letras1: letras, amp })}`,
    '',
    'Llamadas a Bash:',
    ...lineasBash,
    '',
    'Texto final etapa 1:',
    bloque(analyzeRecord(registro1, herramienta).finalText),
    '',
    'Texto final etapa 2:',
    bloque(analyzeRecord(registro2, herramienta).finalText),
    '',
  ].join('\n');
  return { ok, informe: texto };
}

export function informe({ dir, herramienta }) {
  return analizarCorrida({ dir, herramienta }).informe;
}
