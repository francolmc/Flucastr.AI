import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPE_STATUS, validarStatusCompacto, calcularPresupuesto } from '../../scripts/formato-presupuesto.mjs';

// Textos sintéticos: no leen definitions/ ni features/.

const REG = (resultado, intentos = 1) =>
  `Registro: n=1; herramienta=claude-code; modo=yolo; intentos=${intentos}; verificacion=pasa; huecos=0; resultado=${resultado}; causa=ninguna`;

function statusCompacto({ presupuesto = 'Presupuesto: F29; rondas arq=0 plan=0; ampliado=0', retomar = 'F29 task-02' } = {}) {
  return [
    '# Estado',
    'Escalación: ninguna',
    'Paso actual: F29 · task-01 · constructor',
    presupuesto,
    'Espera a Franco: ninguna',
    'Bloqueos abiertos: ninguno',
    `Retomar: ${retomar}`,
    'Actualizado: 2026-11-02',
  ].join('\n');
}

// Rellena el campo Retomar (sin límite de ítems) hasta exactamente n bytes UTF-8.
function statusDeBytes(n) {
  const armar = (items) => statusCompacto({ retomar: items.join(' | ') });
  const items = ['a'];
  let len = Buffer.byteLength(armar(items), 'utf8');
  while (len < n) {
    const falta = n - len;
    if (falta < 4) {
      items[items.length - 1] += 'a'.repeat(falta);
    } else {
      items.push('a'.repeat(Math.min(100, falta - 3)));
    }
    len = Buffer.byteLength(armar(items), 'utf8');
  }
  assert.equal(len, n);
  return armar(items);
}

function tareaCon(...resultados) {
  return resultados.map((r, i) => `# tarea\n${REG(r, i + 1)}`).join('\n');
}

// Un registro «lista» por cada ejecución.
function tareaListas(n) {
  return Array.from({ length: n }, (_, i) => REG('lista', 1)).join('\n');
}

test('TOPE_STATUS es 1536', () => {
  assert.equal(TOPE_STATUS, 1536);
});

test('caso ok: una tarea con una ejecución lista', () => {
  const r = calcularPresupuesto({ feature: 'F29', tareas: [tareaListas(1)], status: statusCompacto() });
  assert.equal(r.estado, 'ok');
  assert.deepEqual(r.causas, []);
  assert.equal(r.linea, 'Presupuesto F29: D=1/6; E=1; I=1; K=0/2; rondas arq=0/2 plan=0/3; estado=ok');
});

test('aviso por D75: D·4 ≥ tope·3 sin superar topes', () => {
  // T=2 → tope 8; D=6 → 24 ≥ 24
  const r = calcularPresupuesto({ feature: 'F29', tareas: [tareaListas(3), tareaListas(3)], status: statusCompacto() });
  assert.equal(r.estado, 'aviso');
  assert.deepEqual(r.causas, ['D75']);
  assert.match(r.linea, /estado=aviso D75$/);
});

test('aviso por K2: dos tareas no listas', () => {
  const r = calcularPresupuesto({
    feature: 'F29',
    tareas: [tareaCon('bloqueada'), tareaCon('bloqueada')],
    status: statusCompacto(),
  });
  assert.equal(r.estado, 'aviso');
  assert.deepEqual(r.causas, ['K2']);
  assert.match(r.linea, /K=2\/2/);
  assert.match(r.linea, /estado=aviso K2$/);
});

test('excedido por D: más ejecuciones que el tope', () => {
  // T=1 → tope 6; E=7 → D=7
  const r = calcularPresupuesto({ feature: 'F29', tareas: [tareaListas(7)], status: statusCompacto() });
  assert.equal(r.estado, 'excedido');
  assert.deepEqual(r.causas, ['D']);
});

test('excedido por K: tres tareas no listas', () => {
  const r = calcularPresupuesto({
    feature: 'F29',
    tareas: [tareaCon('bloqueada'), tareaCon('bloqueada'), tareaCon('escalada')],
    status: statusCompacto(),
  });
  assert.equal(r.estado, 'excedido');
  assert.deepEqual(r.causas, ['K']);
  assert.match(r.linea, /K=3\/2/);
  assert.match(r.linea, /estado=excedido K$/);
});

test('excedido por arq: tres rondas de arquitecto', () => {
  const r = calcularPresupuesto({
    feature: 'F29',
    tareas: [tareaListas(0)],
    status: statusCompacto({ presupuesto: 'Presupuesto: F29; rondas arq=3 plan=0; ampliado=0' }),
  });
  assert.equal(r.estado, 'excedido');
  assert.deepEqual(r.causas, ['arq']);
});

test('excedido por plan: cuatro rondas de planificador', () => {
  const r = calcularPresupuesto({
    feature: 'F29',
    tareas: [tareaListas(0)],
    status: statusCompacto({ presupuesto: 'Presupuesto: F29; rondas arq=0 plan=4; ampliado=0' }),
  });
  assert.equal(r.estado, 'excedido');
  assert.deepEqual(r.causas, ['plan']);
});

test('ampliado sube el tope: la misma carga excede sin él y avisa con él', () => {
  const tareas = [tareaListas(7)];
  const sin = calcularPresupuesto({ feature: 'F29', tareas, status: statusCompacto() });
  assert.equal(sin.estado, 'excedido');

  const con = calcularPresupuesto({
    feature: 'F29',
    tareas,
    status: statusCompacto({ presupuesto: 'Presupuesto: F29; rondas arq=0 plan=0; ampliado=1' }),
  });
  // tope 7; D=7 → no excede, pero 28 ≥ 21 → aviso D75
  assert.match(con.linea, /D=7\/7/);
  assert.equal(con.estado, 'aviso');
  assert.deepEqual(con.causas, ['D75']);
});

test('una línea Presupuesto de otra feature no cuenta sus rondas ni su ampliado', () => {
  const r = calcularPresupuesto({
    feature: 'F29',
    tareas: [tareaListas(1)],
    status: statusCompacto({ presupuesto: 'Presupuesto: F28; rondas arq=3 plan=4; ampliado=2' }),
  });
  assert.equal(r.estado, 'ok');
  assert.match(r.linea, /D=1\/6; E=1; I=1; K=0\/2; rondas arq=0\/2 plan=0\/3; estado=ok$/);
});

test('sin tareas ni estado: línea de base', () => {
  const linea = calcularPresupuesto({ feature: 'F29', tareas: [], status: '' }).linea;
  assert.equal(linea, 'Presupuesto F29: D=0/4; E=0; I=0; K=0/2; rondas arq=0/2 plan=0/3; estado=ok');
});

test('STATUS compacto válido devuelve []', () => {
  assert.deepEqual(validarStatusCompacto(statusCompacto()), []);
});

test('STATUS de exactamente 1536 B es válido', () => {
  const texto = statusDeBytes(1536);
  assert.equal(Buffer.byteLength(texto, 'utf8'), 1536);
  assert.deepEqual(validarStatusCompacto(texto), []);
});

test('STATUS de 1537 B devuelve un motivo con 1536', () => {
  const texto = statusDeBytes(1537);
  assert.equal(Buffer.byteLength(texto, 'utf8'), 1537);
  const motivos = validarStatusCompacto(texto);
  assert.equal(motivos.length, 1);
  assert.match(motivos[0], /1536/);
});

test('falta una línea obligatoria', () => {
  const texto = statusCompacto().split('\n').filter((l) => !l.startsWith('Paso actual: ')).join('\n');
  const motivos = validarStatusCompacto(texto);
  assert.ok(motivos.some((m) => m.includes('Paso actual')));
});

test('dos líneas en orden cambiado', () => {
  const lineas = statusCompacto().split('\n');
  [lineas[1], lineas[2]] = [lineas[2], lineas[1]];
  const motivos = validarStatusCompacto(lineas.join('\n'));
  assert.ok(motivos.length > 0);
  assert.ok(motivos.some((m) => m.includes('fuera de lugar')));
});

test('un ítem de 151 caracteres no es válido', () => {
  const largo = 'x'.repeat(151);
  const texto = statusCompacto().replace('Paso actual: F29 · task-01 · constructor', `Paso actual: ${largo}`);
  const motivos = validarStatusCompacto(texto);
  assert.ok(motivos.some((m) => m.includes('151')));
});

test('un ítem de 150 caracteres sí es válido', () => {
  const justo = 'x'.repeat(150);
  const texto = statusCompacto().replace('Paso actual: F29 · task-01 · constructor', `Paso actual: ${justo}`);
  assert.deepEqual(validarStatusCompacto(texto), []);
});

test('Presupuesto mal formada', () => {
  const texto = statusCompacto({ presupuesto: 'Presupuesto: F29; rondas arq=1 plan=1' });
  const motivos = validarStatusCompacto(texto);
  assert.ok(motivos.some((m) => m.includes('Presupuesto') && m.includes('forma inválida')));
});

test('Espera a Franco con más de tres ítems no es válida', () => {
  const texto = statusCompacto().replace('Espera a Franco: ninguna', 'Espera a Franco: a | b | c | d');
  const motivos = validarStatusCompacto(texto);
  assert.ok(motivos.some((m) => m.includes('4 ítems')));
});
