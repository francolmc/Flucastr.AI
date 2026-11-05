import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const script = path.join(raiz, 'scripts', 'validar-tarea.mjs');
const base = path.join(raiz, 'pruebas', '.temporales');
fs.mkdirSync(base, { recursive: true });
const dir = fs.mkdtempSync(path.join(base, 'validar-tarea-'));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

const valida = [
  '# task-03 — Ejemplo de tarea válida',
  'repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada',
  '',
  '## Descripción',
  'Texto que describe el objetivo de la tarea.',
  '',
  '## Contexto',
  '- Repo: este.',
  '- Tocar: `archivo.mjs`',
  '',
  '## Decisiones ya tomadas',
  '- Se usa `node:test`.',
  '',
  '## Decisiones abiertas',
  'Ninguna.',
  '',
  '## Alcance / Fuera de alcance',
  'Alcance: un archivo nuevo.',
  'Fuera de alcance: hacer commit.',
  '',
  '## Pasos',
  '1. Crear el archivo.',
  '2. Probarlo.',
  '',
  '## Criterios de aceptación',
  '1. Pasa la prueba.',
  '',
  '## Verificación',
  '```',
  'node --test archivo.test.mjs',
  '```',
  'Salida esperada: `ℹ fail 0`.',
  '',
  '## Evidencia',
  '',
  '## Notas',
  '',
].join('\n');

// Control negativo: cuatro rutas en «Tocar» (el máximo es tres).
const cuatroTocar = valida.replace('- Tocar: `archivo.mjs`', '- Tocar: `a.mjs`, `b.mjs`, `c.mjs`, `d.mjs`');

// Decisiones abiertas sin resolver.
const abiertas = valida.replace('## Decisiones abiertas\nNinguna.', '## Decisiones abiertas\nPendiente: a definir por el arquitecto.');

fs.writeFileSync(path.join(dir, 'valida.md'), valida);
fs.writeFileSync(path.join(dir, 'cuatro.md'), cuatroTocar);
fs.writeFileSync(path.join(dir, 'abierta.md'), abiertas);

// Tarea terminada con su evidencia completa: un comando de Verificación con su salida real y «exit 0».
const registro = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';
const bloqueEvidencia = '$ node --test archivo.test.mjs\nℹ tests 1\nℹ fail 0\nexit 0\n';
const evidenciaOk = valida
  .replace('estado: aprobada', 'estado: lista para revisión')
  .replace('## Evidencia\n', `## Evidencia\n\`\`\`\n${bloqueEvidencia}\`\`\`\n`)
  .replace('## Notas\n', `## Notas\n${registro}\n`);
// Control negativo: la misma tarea sin la salida del comando.
const evidenciaFalta = evidenciaOk.replace(bloqueEvidencia, '');

fs.writeFileSync(path.join(dir, 'evidencia-ok.md'), evidenciaOk);
fs.writeFileSync(path.join(dir, 'evidencia-falta.md'), evidenciaFalta);

function correr(...args) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('una tarea válida sola sale con 0 y OK: 1', () => {
  const r = correr('valida.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) válida\(s\)/);
});

test('una tarea inválida sola sale con 1, con su ruta y el motivo sobre «Tocar»', () => {
  const r = correr('cuatro.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /cuatro\.md: /);
  assert.match(r.out, /Tocar/);
});

test('válida más inválida sale con 1 y una sola línea de rechazo', () => {
  const r = correr('valida.md', 'cuatro.md');
  assert.equal(r.code, 1);
  const rechazos = r.out.split('\n').filter((l) => !l.startsWith('Firma:')).filter((l) => l.startsWith('cuatro.md: '));
  assert.equal(rechazos.length, 1);
  assert.equal(r.out.includes('OK:'), false);
});

test('decisiones abiertas sin resolver se rechazan', () => {
  const r = correr('abierta.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /abierta\.md: /);
});

test('sin argumentos sale con 2 y muestra el uso en stderr', () => {
  const r = correr();
  assert.equal(r.code, 2);
  assert.match(r.err, /Uso: node validar-tarea\.mjs (\[--evidencia\] )?<ruta-tarea>\.\.\./);
});

test('ruta inexistente sale con 2 y lo indica en stderr', () => {
  const r = correr('no-existe.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /No se puede leer: no-existe\.md/);
});

test('una ruta ilegible sale con 2 aunque otra sea inválida', () => {
  const r = correr('cuatro.md', 'no-existe.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /No se puede leer: no-existe\.md/);
});

test('--evidencia con una tarea de evidencia completa sale con 0 y OK de evidencia', () => {
  const r = correr('--evidencia', 'evidencia-ok.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) con evidencia completa/);
});

test('--evidencia con una tarea sin la salida del comando sale con 1 y su ruta al inicio de la línea', () => {
  const r = correr('--evidencia', 'evidencia-falta.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /^evidencia-falta\.md: /m);
  assert.equal(r.out.includes('OK:'), false);
});

test('--evidencia con una completa y una incompleta sale con 1 y solo rechaza la incompleta', () => {
  const r = correr('--evidencia', 'evidencia-ok.md', 'evidencia-falta.md');
  assert.equal(r.code, 1);
  const lineas = r.out.split('\n').filter((l) => l !== '' && !l.startsWith('Firma:'));
  assert.ok(lineas.length >= 1);
  assert.ok(lineas.every((l) => l.startsWith('evidencia-falta.md: ')));
  assert.equal(r.out.includes('evidencia-ok.md'), false);
  assert.equal(r.out.includes('OK:'), false);
});

test('una opción desconocida sale con 2 y la nombra en stderr', () => {
  const r = correr('--otra', 'valida.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /Opción desconocida: --otra/);
});

test('--evidencia fuera de la primera posición es una opción desconocida y sale con 2', () => {
  const r = correr('valida.md', '--evidencia', 'evidencia-ok.md');
  assert.equal(r.code, 2);
  assert.match(r.err, /Opción desconocida: --evidencia/);
});

test('--evidencia sin rutas sale con 2 y muestra el uso en stderr', () => {
  const r = correr('--evidencia');
  assert.equal(r.code, 2);
  assert.match(r.err, /Uso: node validar-tarea\.mjs \[--evidencia\] <ruta-tarea>\.\.\./);
});

// Opción --fuente (task-10 de F28): la viñeta «- Fuente:» de «## Contexto» apunta a un encabezado de definitions/.
fs.mkdirSync(path.join(dir, 'definitions'), { recursive: true });
fs.writeFileSync(path.join(dir, 'definitions', 'X.md'), '# Documento de prueba\n\n## Encabezado de prueba\nTexto.\n');
const conFuente = (linea) => valida.replace('- Tocar: `archivo.mjs`', `- Tocar: \`archivo.mjs\`\n${linea}`);
fs.writeFileSync(path.join(dir, 'fuente-ok.md'), conFuente('- Fuente: definitions/X.md «Encabezado de prueba»'));
fs.writeFileSync(path.join(dir, 'fuente-ninguna.md'), conFuente('- Fuente: ninguna'));
fs.writeFileSync(path.join(dir, 'fuente-encabezado.md'), conFuente('- Fuente: definitions/X.md «No existe»'));
fs.writeFileSync(path.join(dir, 'fuente-archivo.md'), conFuente('- Fuente: definitions/no-existe.md «Encabezado de prueba»'));

test('--fuente con una fuente con encabezado existente sale con 0', () => {
  const r = correr('--fuente', 'fuente-ok.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) válida\(s\)/);
});

test('--fuente con «ninguna» sale con 0', () => {
  const r = correr('--fuente', 'fuente-ninguna.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) válida\(s\)/);
});

test('--fuente sobre una tarea sin viñeta «- Fuente:» sale con 1 y la nombra', () => {
  const r = correr('--fuente', 'valida.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /^valida\.md: .*Fuente/m);
});

test('--fuente con un encabezado inexistente sale con 1', () => {
  const r = correr('--fuente', 'fuente-encabezado.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /^fuente-encabezado\.md: /m);
});

test('--fuente con un archivo de fuente inexistente sale con 1', () => {
  const r = correr('--fuente', 'fuente-archivo.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /^fuente-archivo\.md: /m);
});

test('sin --fuente, una tarea sin viñeta «- Fuente:» sigue válida y sale con 0', () => {
  const r = correr('valida.md');
  assert.equal(r.code, 0);
  assert.match(r.out, /OK: 1 tarea\(s\) válida\(s\)/);
});

// Opción --presupuesto (task-02 de F29): carpeta F90-prueba/ y definitions/STATUS.md bajo dir.
const registroLista = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna';
const registroBloqueada = 'Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2';
const tareaCon = (registro) => `# task-01 — Prueba\nrepo: Flucastr.AI   depende_de: —   estado: hecha\n\n## Notas\n${registro}\n`;
const statusValido = (presupuesto = 'Presupuesto: ninguna; rondas arq=0 plan=0; ampliado=0', retomar = 'Retomar: nada') =>
  ['# Estado', 'Escalación: ninguna', 'Paso actual: F90 task-01', presupuesto, 'Espera a Franco: ninguna', 'Bloqueos abiertos: ninguno', retomar, 'Actualizado: 2026-11-02'].join('\n') + '\n';
// Un STATUS.md de exactamente n bytes: la línea «Retomar» lleva ítems de 150 «x» unidos con « | ».
function statusDeBytes(n) {
  const sin = Buffer.byteLength(statusValido(undefined, 'Retomar: x'), 'utf8') - 1;
  const necesario = n - sin;
  const m = Math.floor((necesario - 1) / 153);
  const r = necesario - 153 * m;
  const items = [...Array.from({ length: m }, () => 'x'.repeat(150)), 'x'.repeat(r)];
  return statusValido(undefined, `Retomar: ${items.join(' | ')}`);
}
const carpetaF90 = path.join(dir, 'F90-prueba');
function prepararPresupuesto({ tareas, status }) {
  fs.rmSync(carpetaF90, { recursive: true, force: true });
  fs.mkdirSync(path.join(carpetaF90, 'completed'), { recursive: true });
  for (const [nombre, texto] of Object.entries(tareas)) fs.writeFileSync(path.join(carpetaF90, nombre), texto);
  // Control negativo: dos tareas en completed/ con Registro bloqueada no suman a E ni a K.
  fs.writeFileSync(path.join(carpetaF90, 'completed', 'task-09.md'), tareaCon(registroBloqueada));
  fs.writeFileSync(path.join(carpetaF90, 'completed', 'task-10.md'), tareaCon(registroBloqueada));
  fs.mkdirSync(path.join(dir, 'definitions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'definitions', 'STATUS.md'), status);
}

test('--presupuesto con una tarea lista y STATUS válido sale con 0 y estado=ok', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusValido() });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 0);
  assert.equal(r.out.trim(), 'Presupuesto F90: D=1/6; E=1; I=1; K=0/2; rondas arq=0/2 plan=0/3; estado=ok');
});

test('--presupuesto con dos tareas no listas (K=2) sale con 0 y estado=aviso K2', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroBloqueada), 'task-02.md': tareaCon(registroBloqueada) }, status: statusValido() });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 0);
  assert.equal(r.out.trim(), 'Presupuesto F90: D=2/8; E=2; I=4; K=2/2; rondas arq=0/2 plan=0/3; estado=aviso K2');
});

test('--presupuesto con rondas de arquitecto por encima del tope sale con 1 y estado=excedido', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusValido('Presupuesto: F90; rondas arq=3 plan=0; ampliado=0') });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 1);
  assert.equal(r.out.trim(), 'Presupuesto F90: D=4/6; E=1; I=1; K=0/2; rondas arq=3/2 plan=0/3; estado=excedido arq');
});

test('--presupuesto con amp_arq=1 y arq=3 dentro de tope sale con 0 y estado=ok', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusValido('Presupuesto: F90; rondas arq=3 plan=0; ampliado=0; amp_arq=1') });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 0);
  assert.equal(r.out.trim(), 'Presupuesto F90: D=4/7; E=1; I=1; K=0/2; rondas arq=3/3 plan=0/3; estado=ok');
});

test('--presupuesto con arq=4 y amp_arq=1 sobre el tope ampliado sale con 1 y estado=excedido arq', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusValido('Presupuesto: F90; rondas arq=4 plan=0; ampliado=0; amp_arq=1') });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 1);
  assert.equal(r.out.trim(), 'Presupuesto F90: D=5/7; E=1; I=1; K=0/2; rondas arq=4/3 plan=0/3; estado=excedido arq');
});

test('--presupuesto con un STATUS.md de 1537 B sale con 1 y lo nombra como motivo', () => {
  const status = statusDeBytes(1537);
  assert.equal(Buffer.byteLength(status, 'utf8'), 1537);
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 1);
  assert.match(r.out, /^definitions\/STATUS\.md: El STATUS\.md compacto ocupa 1537 B/m);
  assert.equal(r.out.includes('Presupuesto F90'), false);
});

test('--presupuesto con un STATUS.md sin la línea «Retomar» sale con 1 y lo nombra como motivo', () => {
  const status = statusValido().split('\n').filter((l) => !l.startsWith('Retomar: ')).join('\n');
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status });
  const r = correr('--presupuesto', 'F90-prueba');
  assert.equal(r.code, 1);
  assert.match(r.out, /^definitions\/STATUS\.md: Falta la línea «Retomar»\.$/m);
  assert.equal(r.out.includes('Presupuesto F90'), false);
});

test('--presupuesto con una carpeta inexistente sale con 2 y lo indica en stderr', () => {
  const r = correr('--presupuesto', 'F99-no-existe');
  assert.equal(r.code, 2);
  assert.match(r.err, /No se puede leer la carpeta: F99-no-existe/);
});

test('--presupuesto con un argumento extra sale con 2 y muestra el uso en stderr', () => {
  const r = correr('--presupuesto', 'F90-prueba', 'extra');
  assert.equal(r.code, 2);
  assert.match(r.err, /^Uso: node validar-tarea\.mjs --presupuesto features\/Fxx-nombre/m);
});

test('--presupuesto sin carpeta sale con 2 y muestra el uso en stderr', () => {
  const r = correr('--presupuesto');
  assert.equal(r.code, 2);
  assert.match(r.err, /^Uso: node validar-tarea\.mjs --presupuesto features\/Fxx-nombre/m);
});

// F39, task-02: --presupuesto con --firma <valor>. El digest es el mismo que digestFirma de task-01.
const digestDe = (valor) => createHash('sha256').update(valor, 'utf8').digest('hex').slice(0, 12);
const statusConFirma = (valor) => statusValido(`Presupuesto: F90; rondas arq=0 plan=0; ampliado=0; firma=${digestDe(valor)}`);

test('--presupuesto --firma repetido (misma firma guardada) sale con 1 y estado=repetido', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusConFirma('X') });
  const r = correr('--presupuesto', 'F90-prueba', '--firma', 'X');
  assert.equal(r.code, 1);
  assert.match(r.out.trim(), /estado=repetido/);
});

test('--presupuesto --firma con otra firma distinta sale con 0 y termina en «; firma=<digest de Y>»', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusConFirma('X') });
  const r = correr('--presupuesto', 'F90-prueba', '--firma', 'Y');
  assert.equal(r.code, 0);
  assert.match(r.out.trim(), /estado=(ok|aviso)/);
  assert.match(r.out.trim(), new RegExp(`; firma=${digestDe('Y')}$`));
});

test('--presupuesto --firma sin valor sale con 2 y muestra el uso en stderr', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusValido() });
  const r = correr('--presupuesto', 'F90-prueba', '--firma');
  assert.equal(r.code, 2);
  assert.match(r.err, /^Uso: node validar-tarea\.mjs --presupuesto features\/Fxx-nombre \[--firma <valor>\]/m);
});

test('--presupuesto --firma no escribe en la carpeta de la feature ni en definitions/STATUS.md', () => {
  prepararPresupuesto({ tareas: { 'task-01.md': tareaCon(registroLista) }, status: statusConFirma('X') });
  const estado = () => {
    const entradas = fs.readdirSync(carpetaF90).map((n) => {
      const st = fs.statSync(path.join(carpetaF90, n));
      return [n, st.size, st.mtimeMs];
    });
    const st = fs.statSync(path.join(dir, 'definitions', 'STATUS.md'));
    return { entradas, status: [st.size, st.mtimeMs] };
  };
  const antes = estado();
  correr('--presupuesto', 'F90-prueba', '--firma', 'Y');
  correr('--presupuesto', 'F90-prueba', '--firma', 'X');
  assert.deepEqual(estado(), antes);
});

// F38, task-03: línea «Firma:» del primer rechazo.
const lineas = (salida) => salida.split('\n').filter((l) => l !== '');
const ultimaLinea = (salida) => lineas(salida).at(-1);

// Tarea dañada: un bloque de código sin cerrar al final de «Notas».
const bloqueAbierto = valida.replace('## Notas\n', '## Notas\n```\n');
fs.writeFileSync(path.join(dir, 'bloque.md'), bloqueAbierto);
fs.writeFileSync(path.join(dir, 'cambio.md'), bloqueAbierto);

test('una tarea inválida sale con 1 y su última línea es «Firma: <regla>|<ruta>|<12 hex>»', () => {
  const r = correr('bloque.md');
  assert.equal(r.code, 1);
  assert.match(ultimaLinea(r.out), /^Firma: bloque-abierto\|bloque\.md\|[0-9a-f]{12}$/);
});

test('el mismo archivo dos veces da la misma firma', () => {
  const a = ultimaLinea(correr('bloque.md').out);
  const b = ultimaLinea(correr('bloque.md').out);
  assert.equal(a, b);
});

test('cambiar un carácter del archivo cambia el hash y mantiene la regla', () => {
  const antes = ultimaLinea(correr('cambio.md').out);
  fs.writeFileSync(path.join(dir, 'cambio.md'), bloqueAbierto.replace('Texto que', 'Texto Que'));
  const despues = ultimaLinea(correr('cambio.md').out);
  assert.notEqual(antes, despues);
  assert.equal(antes.split('|')[0], despues.split('|')[0]);
});

test('dos reglas distintas dan identificadores distintos', () => {
  const dañada = ultimaLinea(correr('bloque.md').out);
  const conTocar = ultimaLinea(correr('cuatro.md').out);
  assert.match(dañada, /^Firma: bloque-abierto\|/);
  assert.match(conTocar, /^Firma: otra\|/);
});

test('una tarea válida (código 0) no imprime línea «Firma:»', () => {
  const r = correr('valida.md');
  assert.equal(r.code, 0);
  assert.equal(r.out.includes('Firma:'), false);
});

test('un uso con error (código 2) no imprime línea «Firma:»', () => {
  const r = correr('cuatro.md', 'no-existe.md');
  assert.equal(r.code, 2);
  assert.equal(r.out.includes('Firma:'), false);
});

test('reglaDe clasifica un motivo desconocido como «otra»', async () => {
  const { reglaDe } = await import('../../scripts/firma.mjs');
  assert.equal(reglaDe('algo raro'), 'otra');
});
