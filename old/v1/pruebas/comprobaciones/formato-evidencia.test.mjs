import test from 'node:test';
import assert from 'node:assert/strict';
import { validarEvidencia, coherenciaRegistro } from '../../scripts/formato-evidencia.mjs';

const CMD_X = 'node --test pruebas/comprobaciones/x.test.mjs';
const CMD_Y = 'node --test pruebas/comprobaciones/y.test.mjs';

const EVIDENCIA_BASE = [
  '```',
  `$ ${CMD_X}`,
  'ℹ pass 3',
  'ℹ fail 0',
  'exit 0',
  `$ ${CMD_Y}`,
  'ℹ fail 0',
  'exit 0',
  '```',
  '',
  'Ambas pasaron con `ℹ fail 0`.',
].join('\n');

const NOTAS_BASE = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';

// Arma una tarea completa; cada parámetro puede sustituirse para un caso negativo.
function tarea({
  estado = 'lista para revisión',
  evidencia = EVIDENCIA_BASE,
  notas = NOTAS_BASE,
  esperado = 'Esperado: en ambos `ℹ fail 0`.',
} = {}) {
  return [
    '# task-01 — Ejemplo de evidencia',
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
    CMD_X,
    CMD_Y,
    '```',
    esperado,
    '',
    '## Evidencia',
    evidencia,
    '',
    '## Notas',
    notas,
    '',
  ].join('\n');
}

test('la tarea base completa no tiene motivos', () => {
  assert.deepEqual(validarEvidencia(tarea()), []);
});

test('falta la salida de un comando', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ pass 3',
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes(CMD_Y)), motivos.join('\n'));
});

test('comando con salida vacía', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
    'Ambas pasaron con `ℹ fail 0`.',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('vacía') && m.includes(CMD_X)), motivos.join('\n'));
});

test('fragmento esperado ausente', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 2',
    'exit 0',
    `$ ${CMD_Y}`,
    'ℹ fail 2',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('ℹ fail 0')), motivos.join('\n'));
});

test('exit 1 con «Esperado» que dice «sale 1» no se rechaza', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 1',
    'exit 1',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const esperado = 'Esperado: X sale 1; Y muestra `ℹ fail 0`.';
  assert.deepEqual(validarEvidencia(tarea({ evidencia, esperado })), []);
});

test('exit 1 con «Esperado» sin código y fragmento `ℹ fail 0` presente no se rechaza', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 0',
    'exit 1',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  assert.deepEqual(validarEvidencia(tarea({ evidencia })), []);
});

test('comando sin línea exit N se rechaza citando el comando', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ fail 0',
    `$ ${CMD_Y}`,
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('exit N') && m.includes(CMD_X)), motivos.join('\n'));
});

test('marcador «no ejecutado» en Evidencia', () => {
  const evidencia = `${EVIDENCIA_BASE}\n\nLa prueba de integración: no ejecutado.`;
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('no ejecutado')), motivos.join('\n'));
});

test('sin línea Registro en Notas', () => {
  const motivos = validarEvidencia(tarea({ notas: 'Sin registro todavía.' }));
  assert.ok(motivos.some((m) => m.includes('Registro')), motivos.join('\n'));
});

test('Registro incoherente: verificacion=falla con estado lista para revisión', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=lista; causa=ninguna';
  const motivos = validarEvidencia(tarea({ notas }));
  assert.ok(motivos.some((m) => m.includes('verificacion=pasa')), motivos.join('\n'));
});

test('Registro bloqueada con causa=verificacion_x2 e intentos=2 no produce motivos de Registro', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2';
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas })).filter((m) => m.includes('Registro'));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('Registro bloqueada con causa=parcial y resultado=bloqueada no produce motivos de Registro', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=parcial';
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas })).filter((m) => m.includes('Registro'));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('Registro incoherente: causa=verificacion_x2 con intentos=1 cita intentos=2', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2';
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas })).filter((m) => m.includes('Registro'));
  assert.ok(motivos.some((m) => m.includes('intentos=2')), motivos.join('\n'));
});

test('Registro incoherente: causa=parcial con resultado=escalada cita causa=parcial', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=escalada; causa=parcial';
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas })).filter((m) => m.includes('Registro'));
  assert.ok(motivos.some((m) => m.includes('causa=parcial')), motivos.join('\n'));
});

test('estado aprobada se rechaza: la tarea no está terminada', () => {
  const motivos = validarEvidencia(tarea({ estado: 'aprobada' }));
  assert.ok(motivos.some((m) => m.includes('no está terminada')), motivos.join('\n'));
});

test('estado borrador se rechaza: la tarea no está terminada', () => {
  const motivos = validarEvidencia(tarea({ estado: 'borrador' }));
  assert.ok(motivos.some((m) => m.includes('no está terminada')), motivos.join('\n'));
});

test('estado en curso con evidencia completa pasa', () => {
  assert.deepEqual(validarEvidencia(tarea({ estado: 'en curso' })), []);
});

test('Evidencia de 1536 caracteres pasa y de 1537 se rechaza', () => {
  const conLargo = (n) => `${EVIDENCIA_BASE}\n${'x'.repeat(n - EVIDENCIA_BASE.length - 1)}`;
  assert.equal(conLargo(1536).length, 1536);
  assert.deepEqual(validarEvidencia(tarea({ evidencia: conLargo(1536) })), []);
  const motivos = validarEvidencia(tarea({ evidencia: conLargo(1537) }));
  assert.ok(motivos.includes('«Evidencia» mide 1537 caracteres; el máximo es 1536.'), motivos.join('\n'));
});

test('total de la tarea de 8192 caracteres pasa y de 8193 se rechaza', () => {
  const base = tarea().length;
  const conTotal = (n) => tarea({ notas: `${'x'.repeat(n - base - 1)}\n${NOTAS_BASE}` });
  assert.equal(conTotal(8192).length, 8192);
  assert.deepEqual(validarEvidencia(conTotal(8192)), []);
  const motivos = validarEvidencia(conTotal(8193));
  assert.ok(motivos.includes('La tarea mide 8193 caracteres; el máximo es 8192.'), motivos.join('\n'));
});

test('bloque de código abierto en Evidencia da un único error y no pide la salida', () => {
  const evidencia = ['```sh', `$ ${CMD_X}`, 'ℹ fail 0', 'exit 0'].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.equal(motivos.length, 1, motivos.join('\n'));
  assert.ok(motivos[0].includes('bloque de código abierto en línea'), motivos[0]);
  assert.ok(!motivos.some((m) => m.includes('Falta la salida')), motivos.join('\n'));
});

test('control negativo: dos comandos en Verificación y uno en Evidencia da exactamente un motivo que cita el faltante', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ pass 3',
    'ℹ fail 0',
    'exit 0',
    '```',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.equal(motivos.length, 1, motivos.join('\n'));
  assert.ok(motivos[0].includes(CMD_Y), motivos[0]);
});

test('bloque real de node --test con «ℹ todo 0» y frases con «todo»/«Todo» no se rechaza por pendientes', () => {
  const evidencia = [
    '```',
    `$ ${CMD_X}`,
    'ℹ tests 3',
    'ℹ suites 0',
    'ℹ pass 3',
    'ℹ fail 0',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
    'exit 0',
    `$ ${CMD_Y}`,
    'ℹ tests 2',
    'ℹ suites 0',
    'ℹ pass 2',
    'ℹ fail 0',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
    'exit 0',
    '```',
    '',
    'Todo quedó en verde, con `ℹ fail 0` en ambos comandos.',
    'Ningún caso todo queda pendiente.',
  ].join('\n');
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.deepEqual(motivos.filter((m) => m.includes('pendiente')), [], motivos.join('\n'));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('TODO en mayúsculas en Evidencia se rechaza y el motivo cita TODO', () => {
  const evidencia = `${EVIDENCIA_BASE}\n\nFalta revisar el caso borde. TODO\n`;
  const motivos = validarEvidencia(tarea({ evidencia }));
  assert.ok(motivos.some((m) => m.includes('«TODO»')), motivos.join('\n'));
});

test('coherenciaRegistro: registro coherente (pasa, lista, ninguna) no da motivos', () => {
  const motivos = coherenciaRegistro({ estado: 'lista para revisión', verificacion: 'pasa', resultado: 'lista', causa: 'ninguna', intentos: 1 });
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('coherenciaRegistro: parcial con lista y estado cita resultado=bloqueada; causa=parcial', () => {
  const motivos = coherenciaRegistro({ estado: 'lista para revisión', verificacion: 'parcial', resultado: 'lista', causa: 'ninguna', intentos: 1 });
  assert.ok(motivos.some((m) => m.includes('resultado=bloqueada; causa=parcial')), motivos.join('\n'));
});

test('coherenciaRegistro: parcial con lista sin estado cita resultado=bloqueada; causa=parcial', () => {
  const motivos = coherenciaRegistro({ verificacion: 'parcial', resultado: 'lista', causa: 'ninguna' });
  assert.ok(motivos.some((m) => m.includes('resultado=bloqueada; causa=parcial')), motivos.join('\n'));
});

test('coherenciaRegistro: falla con lista sin estado da motivo', () => {
  const motivos = coherenciaRegistro({ verificacion: 'falla', resultado: 'lista', causa: 'ninguna' });
  assert.ok(motivos.length > 0, 'debe haber al menos un motivo');
  assert.ok(motivos.some((m) => m.includes('verificacion=falla')), motivos.join('\n'));
});

test('coherenciaRegistro: parcial con bloqueada y causa parcial no da motivos', () => {
  const motivos = coherenciaRegistro({ verificacion: 'parcial', resultado: 'bloqueada', causa: 'parcial' });
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('coherenciaRegistro: claves undefined omiten sus reglas', () => {
  assert.deepEqual(coherenciaRegistro({ verificacion: 'pasa', resultado: 'lista', causa: 'ninguna' }), []);
  assert.deepEqual(coherenciaRegistro({ estado: 'lista para revisión', verificacion: 'pasa', resultado: 'lista', causa: 'ninguna' }), []);
  assert.deepEqual(coherenciaRegistro({}), []);
});

test('coherenciaRegistro: causa=verificacion_x2 con intentos=1 cita intentos=2', () => {
  const motivos = coherenciaRegistro({ estado: 'bloqueada', verificacion: 'falla', resultado: 'bloqueada', causa: 'verificacion_x2', intentos: 1 });
  assert.ok(motivos.some((m) => m.includes('intentos=2')), motivos.join('\n'));
});

test('validarEvidencia: estado lista con verificacion=parcial cita resultado=bloqueada; causa=parcial', () => {
  const notas = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=parcial; huecos=0; resultado=lista; causa=ninguna';
  const motivos = validarEvidencia(tarea({ estado: 'lista para revisión', notas }));
  assert.ok(motivos.some((m) => m.includes('resultado=bloqueada; causa=parcial')), motivos.join('\n'));
});

const REGISTRO_BLOQUEADA_OTRA = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra';

test('cancelada válida con Cancelada: motivo=obsoleta y sin evidencia de verificación da []', () => {
  const motivos = validarEvidencia(tarea({ estado: 'cancelada', evidencia: '', notas: 'Cancelada: motivo=obsoleta' }));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('cancelada sin línea Cancelada: da el motivo exacto', () => {
  const motivos = validarEvidencia(tarea({ estado: 'cancelada', evidencia: '', notas: '' }));
  assert.deepEqual(motivos, ['Una tarea «cancelada» exige una línea «Cancelada: motivo=…» en «Notas».']);
});

test('cancelada con motivo fuera de la lista se rechaza citando el motivo', () => {
  const motivos = validarEvidencia(tarea({ estado: 'cancelada', evidencia: '', notas: 'Cancelada: motivo=nueva' }));
  assert.ok(motivos.some((m) => m.includes('«nueva»')), motivos.join('\n'));
});

test('cancelada con dos líneas Cancelada: se rechaza', () => {
  const notas = 'Cancelada: motivo=obsoleta\nCancelada: motivo=duplicada';
  const motivos = validarEvidencia(tarea({ estado: 'cancelada', evidencia: '', notas }));
  assert.ok(motivos.some((m) => m.includes('hay 2')), motivos.join('\n'));
});

test('Bloqueo: válida antes de Registro: con causa=otra no da motivos', () => {
  const notas = `Bloqueo: tipo=entorno; falta=docker\n${REGISTRO_BLOQUEADA_OTRA}`;
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas }));
  assert.deepEqual(motivos, [], motivos.join('\n'));
});

test('Bloqueo: mal formada (tipo fuera de la lista) se rechaza citando el tipo', () => {
  const notas = `Bloqueo: tipo=desconocido; falta=docker\n${REGISTRO_BLOQUEADA_OTRA}`;
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas }));
  assert.ok(motivos.some((m) => m.includes('«desconocido»')), motivos.join('\n'));
});

test('Bloqueo: después de Registro: se rechaza', () => {
  const notas = `${REGISTRO_BLOQUEADA_OTRA}\nBloqueo: tipo=entorno; falta=docker`;
  const motivos = validarEvidencia(tarea({ estado: 'bloqueada', notas }));
  assert.ok(motivos.some((m) => m.includes('debe ir antes de «Registro:»')), motivos.join('\n'));
});

test('Bloqueo: tipo=entorno con causa=ninguna se rechaza por coherencia', () => {
  const notas = `Bloqueo: tipo=entorno; falta=docker\n${NOTAS_BASE}`;
  const motivos = validarEvidencia(tarea({ estado: 'lista para revisión', notas }));
  assert.ok(motivos.some((m) => m.includes('tipo=entorno exige causa=otra')), motivos.join('\n'));
});
