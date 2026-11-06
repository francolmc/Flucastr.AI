import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { calcularInforme, formatearMarkdown, leerArgumentos, leerEventos, wilson, UMBRAL_TAREAS, UMBRAL_CORTE } from '../../scripts/informe.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(RAIZ, 'scripts', 'informe.mjs');

// Valores por tarea (índice 0 = tarea 1) del escenario de referencia.
const INTENTOS = [1, 1, 2, 1, 1, 3, 1, 1, 2, 1];
const HUECOS = [0, 1, 2, 0, 1, 3, 0, 1, 0, 4];
const BASE = Date.parse('2026-10-01T10:00:00Z');
const iso = (horas) => new Date(BASE + horas * 3600000).toISOString().slice(0, 19) + 'Z';
const hex = (n, largo) => n.toString(16).padStart(largo, '0');

// Arma un evento válido según el ESQUEMA de registrar.mjs.
let contador = 0;
function ev(evento, t, campos) {
  contador++;
  const base = { v: 1, id: hex(contador, 12), t, evento };
  const fuente = { ejecucion: 'notas', escalacion: 'status' }[evento] ?? 'git';
  return { ...base, fuente, ...campos };
}

// Escenario de referencia con n tareas (1 a 10): cada tarea en su feature, tarea "01".
function escenario(n = 10) {
  const eventos = [];
  for (let i = 1; i <= n; i++) {
    const feature = `F${String(i).padStart(2, '0')}`;
    const sha = `abc${hex(i, 4)}`;
    const tarea = '01';
    const i0 = i - 1;
    eventos.push(ev('feature_estado', iso(0), { feature, sha, de: null, a: 'en curso' }));
    eventos.push(ev('feature_estado', iso(10 * i), { feature, sha, de: 'en curso', a: 'hecha' }));
    eventos.push(ev('tarea_estado', iso(0), { feature, tarea, sha, de: 'borrador', a: 'aprobada', por: 'franco' }));
    eventos.push(ev('tarea_estado', iso(2 * i), { feature, tarea, sha, de: 'lista para revisión', a: 'hecha', por: 'franco' }));
    if (i === 2) eventos.push(ev('puerta', iso(30), { feature, tarea, sha, n: 4, resultado: 'devuelta', por: 'franco' }));
    if (i === 5) {
      eventos.push(ev('puerta', iso(30), { feature, tarea, sha, n: 4, resultado: 'devuelta', por: 'franco' }));
      eventos.push(ev('puerta', iso(31), { feature, tarea, sha, n: 4, resultado: 'devuelta', por: 'franco' }));
    }
    const bloqueada = i === 3;
    const escalada = i === 9;
    eventos.push(
      ev('ejecucion', iso(1), {
        feature,
        tarea,
        sha,
        n: 1,
        herramienta: i <= 6 ? 'claude-code' : 'pi',
        modo: i === 10 ? 'yolo' : 'normal',
        intentos: INTENTOS[i0],
        verificacion: bloqueada || escalada ? 'falla' : 'pasa',
        huecos: HUECOS[i0],
        resultado: bloqueada ? 'bloqueada' : escalada ? 'escalada' : 'lista',
        causa: bloqueada ? 'verificacion_x2' : escalada ? 'alcance' : 'ninguna',
        modelo: i <= 6 ? 'claude-x' : 'pi-y',
      }),
    );
  }
  return eventos;
}

const aJsonl = (eventos) => eventos.map((e) => JSON.stringify(e)).join('\n') + '\n';

function raizCon(contenido, extras = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-test-'));
  if (contenido !== null) {
    fs.mkdirSync(path.join(raiz, 'registro'), { recursive: true });
    fs.writeFileSync(path.join(raiz, 'registro', 'eventos.jsonl'), contenido);
  }
  for (const [nombre, texto] of Object.entries(extras)) fs.writeFileSync(path.join(raiz, nombre), texto);
  return raiz;
}

function correr(raiz, args = []) {
  return spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, ...args], { encoding: 'utf8' });
}

function listarRecursivo(dir, base = dir, salida = []) {
  for (const n of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, n);
    const st = fs.statSync(abs);
    salida.push(`${path.relative(base, abs)} ${st.isDirectory() ? 'dir' : st.size}`);
    if (st.isDirectory()) listarRecursivo(abs, base, salida);
  }
  return salida;
}

test('Wilson a mano: k=8, n=10 da [49.0–94.3]', () => {
  assert.deepEqual(wilson(8, 10), { bajo: 49.0, alto: 94.3 });
  assert.notDeepEqual(wilson(8, 11), { bajo: 49.0, alto: 94.3 });
});

test('(1) umbral: 9 tareas dan DATOS INSUFICIENTES sin porcentajes; 10 dan cifras; --minimo 9 calcula con 9', () => {
  assert.equal(UMBRAL_TAREAS, 10);
  assert.equal(UMBRAL_CORTE, 5);
  const con9 = calcularInforme(leerEventos(aJsonl(escenario(9))).eventos, { minimo: UMBRAL_TAREAS });
  const md9 = formatearMarkdown(con9);
  assert.match(md9.split('\n')[0], /^DATOS INSUFICIENTES: n=9 de 10; no se calculan porcentajes ni medianas$/);
  assert.equal(md9.includes('%'), false);

  const con10 = calcularInforme(leerEventos(aJsonl(escenario(10))).eventos, { minimo: UMBRAL_TAREAS });
  const md10 = formatearMarkdown(con10);
  assert.equal(md10.startsWith('DATOS INSUFICIENTES'), false);
  assert.match(md10, /%/);

  const control = calcularInforme(leerEventos(aJsonl(escenario(9))).eventos, { minimo: 9 });
  assert.equal(control.suficiente, true);
  assert.match(formatearMarkdown(control), /%/);
});

test('(2) cifras conocidas del escenario de referencia, con Wilson', () => {
  const informe = calcularInforme(leerEventos(aJsonl(escenario(10))).eventos, { minimo: UMBRAL_TAREAS });
  assert.equal(informe.suficiente, true);
  assert.equal(informe.tareas, 10);
  assert.equal(informe.ejecuciones, 10);
  assert.equal(informe.eventosHasta, '2026-10-05T14:00:00Z');

  // Entrega: 10 hechas, 2 con devolución (tarea 2 y tarea 5, que tiene dos) → 8 sin devolución; media 3/10.
  assert.equal(informe.entrega.n, 10);
  assert.equal(informe.entrega.sinDevolucion.k, 8);
  assert.equal(informe.entrega.sinDevolucion.pct, 80.0);
  assert.deepEqual(informe.entrega.sinDevolucion.wilson, { bajo: 49.0, alto: 94.3 });
  assert.equal(informe.entrega.devolucionesMedia, 0.3);

  // Calidad: huecos 0,1,2,0,1,3,0,1,0,4 → media 1.2, mediana 1.0, máximo 4.
  assert.equal(informe.calidad.media, 1.2);
  assert.equal(informe.calidad.mediana, 1.0);
  assert.equal(informe.calidad.maximo, 4);

  // Fiabilidad: intentos 14/10 = 1.4; pasa 8 de 10 con Wilson 8/10; bloqueo por verificacion_x2, escalación por alcance.
  assert.equal(informe.fiabilidad.intentosMedia, 1.4);
  assert.equal(informe.fiabilidad.pasa.pct, 80.0);
  assert.deepEqual(informe.fiabilidad.pasa.wilson, { bajo: 49.0, alto: 94.3 });
  assert.deepEqual(informe.fiabilidad.bloqueadasPorCausa, { verificacion_x2: 1 });
  assert.deepEqual(informe.fiabilidad.escaladasPorCausa, { alcance: 1 });

  // Ritmo: aprobada→hecha = 2i horas, mediana (10+12)/2 = 11.0; en curso→hecha = 10i horas, mediana 55.0.
  assert.equal(informe.ritmo.tareas.n, 10);
  assert.equal(informe.ritmo.tareas.medianaHoras, 11.0);
  assert.equal(informe.ritmo.features.n, 10);
  assert.equal(informe.ritmo.features.medianaHoras, 55.0);

  // Cortes: claude-x (tareas 1 a 6) con 5 de 6 pasa; pi-y con 4 tareas no alcanza el umbral de corte.
  const modelo = Object.fromEntries(informe.cortes.modelo.map((c) => [c.valor, c]));
  assert.equal(modelo['claude-x'].insuficiente, false);
  assert.equal(modelo['claude-x'].n, 6);
  assert.equal(modelo['claude-x'].pasa.k, 5);
  assert.equal(modelo['pi-y'].insuficiente, true);
  assert.equal(modelo['pi-y'].n, 4);
  const modo = Object.fromEntries(informe.cortes.modo.map((c) => [c.valor, c]));
  assert.equal(modo.yolo.insuficiente, true);
  assert.equal(modo.normal.n, 9);
  assert.equal(modo.normal.pasa.k, 7);

  const md = formatearMarkdown(informe);
  assert.match(md, /\| modelo pi-y \| 4 \| n insuficiente \| n insuficiente \|/);
  assert.match(md, /\| modelo claude-x \| 6 \| 1\.2 \| 83\.3% \[/);
  assert.match(md, /^# Informe de resultados del flujo\neventos hasta 2026-10-05T14:00:00Z/m);
  assert.match(md, /## Límites de esta lectura/);
});

test('(2b) control negativo: sin eventos de aprobada el ritmo no cuenta', () => {
  const sin = escenario(10).filter((e) => !(e.evento === 'tarea_estado' && e.a === 'aprobada'));
  const informe = calcularInforme(leerEventos(aJsonl(sin)).eventos, { minimo: UMBRAL_TAREAS });
  assert.equal(informe.ritmo.tareas.n, 0);
  assert.equal(informe.ritmo.tareas.medianaHoras, null);
  assert.equal(informe.ritmo.features.n, 10);
});

test('(2c) control negativo: la calidad usa la ejecución de mayor n de cada tarea', () => {
  const eventos = escenario(10);
  const extra = ev('ejecucion', iso(2), {
    feature: 'F01', tarea: '01', sha: 'abc0001', n: 2, herramienta: 'claude-code', modo: 'normal',
    intentos: 1, verificacion: 'pasa', huecos: 9, resultado: 'lista', causa: 'ninguna', modelo: 'claude-x',
  });
  const informe = calcularInforme(leerEventos(aJsonl([...eventos, extra])).eventos, { minimo: UMBRAL_TAREAS });
  // Mayor n para F01 es huecos=9: la lista de huecos pasa a 0→9 en lugar de 0.
  assert.equal(informe.calidad.maximo, 9);
  // Huecos usados: 9,1,2,0,1,3,0,1,0,4 → suma 21, media 2.1 (con la de n=1 sería 1.2).
  assert.equal(informe.calidad.media, 2.1);
});

test('(3) cortes: un grupo con 4 tareas dice n insuficiente; con 5 muestra cifra', () => {
  const informe = calcularInforme(leerEventos(aJsonl(escenario(10))).eventos, { minimo: UMBRAL_TAREAS });
  const md = formatearMarkdown(informe);
  const filaPi = md.split('\n').find((l) => l.startsWith('| modelo pi-y'));
  assert.equal(filaPi.includes('%'), false);
  const filaX = md.split('\n').find((l) => l.startsWith('| modelo claude-x'));
  assert.match(filaX, /%/);
});

test('(4) líneas no válidas: se descartan, se cuentan y el resto se calcula igual', () => {
  const limpio = aJsonl(escenario(10));
  const sucio = limpio + '{"roto":\n' + JSON.stringify({ ...escenario(1)[4], titulo: 'SECRETO-CANARIO' }) + '\n';
  const a = calcularInforme(leerEventos(limpio).eventos, { minimo: UMBRAL_TAREAS, lineasNoValidas: 0 });
  const r = leerEventos(sucio);
  assert.equal(r.lineasNoValidas, 2);
  const b = calcularInforme(r.eventos, { minimo: UMBRAL_TAREAS, lineasNoValidas: r.lineasNoValidas });
  assert.equal(b.lineasNoValidas, 2);
  assert.deepEqual({ ...b, lineasNoValidas: 0 }, { ...a, lineasNoValidas: 0 });
  assert.equal(formatearMarkdown(b).includes('SECRETO-CANARIO'), false);
  assert.match(formatearMarkdown(b), /líneas no válidas: 2/);
});

test('(4b) control negativo: la misma línea válida sí cuenta; la inválida no se imprime por la CLI', () => {
  const raiz = raizCon(aJsonl(escenario(10)) + '{"roto":\n' + JSON.stringify({ ...escenario(1)[4], titulo: 'SECRETO-CANARIO' }) + '\n');
  const r = correr(raiz);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /líneas no válidas: 2/);
  assert.equal(r.stdout.includes('SECRETO-CANARIO'), false);
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('(5) determinismo: dos corridas con el mismo log dan el mismo informe.md byte a byte', () => {
  const raiz = raizCon(aJsonl(escenario(10)));
  const r1 = correr(raiz);
  const bytes1 = fs.readFileSync(path.join(raiz, 'registro', 'informe.md'));
  const r2 = correr(raiz);
  const bytes2 = fs.readFileSync(path.join(raiz, 'registro', 'informe.md'));
  assert.equal(r1.status, 0);
  assert.equal(r2.status, 0);
  assert.equal(Buffer.compare(bytes1, bytes2), 0);
  assert.equal(r1.stdout, r2.stdout);
  assert.equal(r1.stdout, bytes1.toString('utf8'));
  fs.rmSync(raiz, { recursive: true, force: true });
});

test('(7) aislamiento: solo escribe registro/informe.md; no toca .env; sin log sale con 1 y no crea nada', () => {
  const raiz = raizCon(aJsonl(escenario(10)), { '.env': 'CANARIO=SECRETO-ENV\n' });
  const antes = listarRecursivo(raiz);
  const r = correr(raiz);
  assert.equal(r.status, 0, r.stderr);
  const despues = listarRecursivo(raiz);
  const nuevos = despues.filter((x) => !antes.includes(x));
  assert.deepEqual(nuevos.map((x) => x.split(' ')[0]), ['registro/informe.md']);
  assert.equal(r.stdout.includes('SECRETO-ENV'), false);
  assert.equal(r.stderr.includes('SECRETO-ENV'), false);
  fs.rmSync(raiz, { recursive: true, force: true });

  const vacia = raizCon(null);
  const antesVacia = listarRecursivo(vacia);
  const rv = correr(vacia);
  assert.equal(rv.status, 1);
  assert.match(rv.stderr, /corre antes `node scripts\/registrar\.mjs`/);
  assert.deepEqual(listarRecursivo(vacia), antesVacia);
  fs.rmSync(vacia, { recursive: true, force: true });
});

test('control CLI: opción desconocida, repetida o --minimo inválido salen con 1 y no escriben', () => {
  const raiz = raizCon(aJsonl(escenario(10)));
  const antes = listarRecursivo(raiz);
  for (const args of [['--x'], ['--json', '--json'], ['--minimo', '0'], ['--minimo', 'abc'], ['--raiz']]) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', cwd: raiz });
    assert.equal(r.status, 1, JSON.stringify(args));
  }
  assert.deepEqual(listarRecursivo(raiz), antes);
  assert.equal(leerArgumentos(['--x']).error, "argumento desconocido '--x'");
  fs.rmSync(raiz, { recursive: true, force: true });
});
