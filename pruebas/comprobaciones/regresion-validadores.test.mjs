import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTarea } from '../../scripts/formato-tarea.mjs';
import { validarEvidencia } from '../../scripts/formato-evidencia.mjs';
import { validarFuente } from '../../scripts/formato-fuente.mjs';

// Regresión de los validadores sobre las tareas de F24–F29, F30 y F33 (features/ y features/completed/).
// La base pruebas/fixtures/regresion-f24-f29.json la escribe esta misma prueba con FLUCASTR_GENERAR_BASE=1.

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const BASE = path.join(RAIZ, 'pruebas/fixtures/regresion-f24-f29.json');
const CARPETAS = ['features', 'features/completed'];
const CARPETA_FEATURE = /^F(2[4-9]|3[03])-/;
const ARCHIVO_TAREA = /^task-\d{2}-.+\.md$/;

const leer = (ruta) => {
  const abs = path.join(RAIZ, ruta);
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? fs.readFileSync(abs, 'utf8') : null;
};

// Devuelve { "<carpeta>/<archivo>": ruta absoluta }. Sin el prefijo de la base, así archivar no cambia la clave.
function buscarTareas() {
  const tareas = {};
  for (const relativa of CARPETAS) {
    const raiz = path.join(RAIZ, relativa);
    if (!fs.existsSync(raiz)) continue;
    for (const carpeta of fs.readdirSync(raiz)) {
      const abs = path.join(raiz, carpeta);
      if (!CARPETA_FEATURE.test(carpeta) || !fs.statSync(abs).isDirectory()) continue;
      for (const archivo of fs.readdirSync(abs)) {
        if (ARCHIVO_TAREA.test(archivo)) tareas[`${carpeta}/${archivo}`] = path.join(abs, archivo);
      }
    }
  }
  return tareas;
}

// Respuesta de los tres validadores para cada tarea, con claves ordenadas.
function calcularTodas() {
  const tareas = buscarTareas();
  const salida = {};
  for (const clave of Object.keys(tareas).sort()) {
    const texto = fs.readFileSync(tareas[clave], 'utf8');
    salida[clave] = {
      evidencia: validarEvidencia(texto),
      formato: validarTarea(texto),
      fuente: validarFuente(texto, leer),
    };
  }
  return salida;
}

// Claves de base que siguen existiendo hoy y cuya respuesta cambió.
export function diferencias(base, actual) {
  return Object.keys(base)
    .filter((clave) => clave in actual)
    .filter((clave) => JSON.stringify(base[clave]) !== JSON.stringify(actual[clave]));
}

test('regresion: los validadores responden igual que la base de F24–F29', () => {
  const actual = calcularTodas();
  if (process.env.FLUCASTR_GENERAR_BASE === '1') {
    fs.writeFileSync(BASE, JSON.stringify(actual, null, 2) + '\n');
    return;
  }
  const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
  assert.deepEqual(diferencias(base, actual), []);
});

test('control negativo: una base alterada produce al menos una diferencia', () => {
  const actual = calcularTodas();
  const base = JSON.parse(JSON.stringify(actual));
  const clave = Object.keys(base)[0];
  base[clave].formato = [...base[clave].formato, 'motivo alterado a propósito'];
  assert.ok(diferencias(base, actual).length >= 1);
});

// Casos de borde de F30 (task-05). Armado copiado de formato-evidencia.test.mjs, sin importarlo.
const CMD_REGRESION = 'node --test pruebas/comprobaciones/x.test.mjs';
const EVIDENCIA_REGRESION = ['```', `$ ${CMD_REGRESION}`, 'ℹ fail 0', 'exit 0', '```', '', 'Pasó con `ℹ fail 0`.'].join('\n');

function tareaTerminada(notas, estado = 'lista para revisión') {
  return [
    '# task-01 — Caso de borde de regresión',
    `repo: Flucastr.AI   depende_de: —   estado: ${estado}`,
    '',
    '## Descripción',
    'Texto breve que describe el objetivo.',
    '',
    '## Contexto',
    '- Tocar: `scripts/x.mjs`',
    '',
    '## Decisiones ya tomadas',
    'Ninguna.',
    '',
    '## Decisiones abiertas',
    'Ninguna.',
    '',
    '## Alcance / Fuera de alcance',
    'Alcance: el ejemplo. Fuera de alcance: nada más.',
    '',
    '## Pasos',
    '1. Paso uno.',
    '',
    '## Criterios de aceptación',
    '1. Criterio uno.',
    '',
    '## Verificación',
    '```',
    CMD_REGRESION,
    '```',
    'Esperado: `ℹ fail 0`.',
    '',
    '## Evidencia',
    EVIDENCIA_REGRESION,
    '',
    '## Notas',
    notas,
    '',
  ].join('\n');
}

test('borde (a): Registro con 7 claves y Registro con 8 claves reordenadas siguen rechazados con el motivo de los 8 campos', () => {
  const siete = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista';
  const reordenada = 'Registro: n=1; herramienta=claude-code; modo=yolo; verificacion=pasa; intentos=1; huecos=0; resultado=lista; causa=ninguna';
  for (const linea of [siete, reordenada]) {
    const motivos = validarEvidencia(tareaTerminada(linea));
    assert.ok(motivos.some((m) => m.includes('8 campos')), `${linea}\n${motivos.join('\n')}`);
  }
});

test('borde (b): una línea Registro coherente de 8 claves no produce motivos de Registro', () => {
  const coherente = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';
  const motivos = validarEvidencia(tareaTerminada(coherente)).filter((m) => m.includes('Registro'));
  assert.deepEqual(motivos, []);
});

test('borde (c): tarea bloqueada con Bloqueo: antes de Registro: validarEvidencia no produce motivos de Registro', () => {
  const notas = [
    'Bloqueo: tipo=entorno; falta=docker',
    'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=0; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra',
  ].join('\n');
  const motivos = validarEvidencia(tareaTerminada(notas, 'bloqueada')).filter((m) => m.includes('Registro'));
  assert.deepEqual(motivos, []);
});

test('borde (d): una línea Requiere en Contexto no cambia validarEvidencia ni validarFuente de una tarea válida', () => {
  const coherente = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';
  const base = tareaTerminada(coherente);
  const conRequiere = base.replace('- Tocar: `scripts/x.mjs`', '- Tocar: `scripts/x.mjs`\n- Requiere: docker, puerto:55432');
  assert.notEqual(conRequiere, base, 'la línea Requiere debe insertarse en Contexto');
  assert.deepEqual(validarEvidencia(conRequiere), validarEvidencia(base));
  assert.deepEqual(validarFuente(conRequiere, leer), validarFuente(base, leer));
});
