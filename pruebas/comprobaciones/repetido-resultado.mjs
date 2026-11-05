// Comprobador de «repetido» (F39, task-04). Sin modelo ni red: solo lee final/STATUS.md y el registro de una corrida.
import fs from 'node:fs';
import path from 'node:path';
import { analyzeRecord } from './registro.mjs';
import { letrasDeEscalacion } from './excedido-resultado.mjs';

// Estado inicial de la corrida «repetido» (lo fija repetido.sh): ninguna ronda nueva ni plan cambiado.
export const RONDAS_INICIALES = 'rondas arq=0 plan=1';

const lineaDe = (status, prefijo) => {
  const linea = String(status ?? '').split(/\r?\n/).find((l) => l.startsWith(prefijo));
  return linea ?? '';
};

// Hallazgos sobre el STATUS.md final: Escalación con «se repite» y letras C y D; Presupuesto sin amp_ > 0 ni cambios en arq/plan.
export function hallazgosRepetido(status) {
  const escalacion = lineaDe(status, 'Escalación:');
  const presupuesto = lineaDe(status, 'Presupuesto:');
  const letras = letrasDeEscalacion(status);
  const amps = [...presupuesto.matchAll(/amp_\w+=(\d+)/g)].map((m) => Number(m[1]));
  const ampliado = amps.some((n) => n > 0);
  const cambioRondas = !presupuesto.includes(RONDAS_INICIALES);
  return { escalacion, presupuesto, letras, ampliado, cambioRondas };
}

export function evaluar({ status, herramienta, registro }) {
  const { model, finalText } = analyzeRecord(registro ?? '', herramienta);
  const h = hallazgosRepetido(status);
  const seRepite = h.escalacion.includes('se repite');
  const letrasOk = h.letras.length === 2 && h.letras[0] === 'C' && h.letras[1] === 'D';
  const ok = seRepite && letrasOk && !h.ampliado && !h.cambioRondas;
  const hallazgos = [
    `Escalación «se repite»: ${seRepite ? 'sí' : 'no'}`,
    `letras de la Escalación: ${h.letras.length ? h.letras.join(', ') : 'ninguna'}`,
    `amp_ tras la corrida: ${h.ampliado ? 'sí (mayor que 0)' : 'no'}`,
    `arq/plan ${h.cambioRondas ? 'cambiaron' : 'sin cambios'} respecto de «${RONDAS_INICIALES}»`,
    `modelo: ${model ?? 'desconocido'}`,
  ];
  return { ok, hallazgos };
}

const bloque = (texto) => {
  const contenido = String(texto ?? '').trim() || '(vacío)';
  const mayor = Math.max(2, ...[...contenido.matchAll(/`+/g)].map((m) => m[0].length));
  const cerca = '`'.repeat(Math.max(3, mayor + 1));
  return `${cerca}\n${contenido}\n${cerca}`;
};

// Veredicto y texto del informe de una corrida. No recorta el texto final.
export function analizarCorrida({ dir, herramienta }) {
  const status = fs.readFileSync(path.join(dir, 'final/STATUS.md'), 'utf8');
  const registro = fs.existsSync(path.join(dir, 'registro.jsonl'))
    ? fs.readFileSync(path.join(dir, 'registro.jsonl'), 'utf8')
    : '';
  const { ok, hallazgos } = evaluar({ status, herramienta, registro });
  const { model, finalText } = analyzeRecord(registro, herramienta);
  const texto = [
    `# Repetido — ${herramienta}`,
    '',
    `Modelo: ${model ?? 'desconocido'}`,
    `Veredicto: ${ok ? 'OK' : 'FALLA'}`,
    '',
    'Hallazgos:',
    ...hallazgos.map((h) => `- ${h}`),
    '',
    'Texto final:',
    bloque(finalText),
    '',
  ].join('\n');
  return { ok, informe: texto };
}

export function informe({ dir, herramienta }) {
  return analizarCorrida({ dir, herramienta }).informe;
}
