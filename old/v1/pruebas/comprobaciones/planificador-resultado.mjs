// Comprobador de la corrida del planificador (F42, task-05). Sin modelo ni red: lee las tareas que deja el planificador
// en dir/fixture/features/F01-demo y las valida con el validador real (scripts/validar-tarea.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDADOR = path.join(RAIZ, 'scripts', 'validar-tarea.mjs');
const CARPETA = path.join('features', 'F01-demo');
const RE_TAREA = /^task-.*\.md$/;
const RE_ESTADO = /estado: (\S.*?)\s*$/;
const RE_LEER = /^- Leer: (.+)$/m;
const RE_ITEM = /^`(.+?)(?:@(\d+)-(\d+))?`$/;
const RE_PASO = /^\d+\. /;

// Bytes de un archivo de «Leer»: entero o el tramo offset-limit, como en formato-topes.mjs.
function bytesDeItem(fixture, ruta, offset, limit) {
  const archivo = path.join(fixture, ruta);
  if (!fs.existsSync(archivo)) return 0;
  const texto = fs.readFileSync(archivo, 'utf8');
  if (offset === undefined) return Buffer.byteLength(texto);
  const tramo = texto.split('\n').slice(Number(offset) - 1, Number(offset) - 1 + Number(limit)).join('\n');
  return Buffer.byteLength(`${tramo}\n`);
}

// Cifras de una tarea: pasos numerados, archivos a leer y bytes de contexto.
function cifrasDe(fixture, texto) {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const inicio = lineas.indexOf('## Pasos');
  let pasos = 0;
  if (inicio !== -1) {
    for (let i = inicio + 1; i < lineas.length && !lineas[i].startsWith('## '); i += 1) {
      if (RE_PASO.test(lineas[i])) pasos += 1;
    }
  }
  const leer = RE_LEER.exec(texto)?.[1] ?? '';
  const items = leer.split(', ').map((s) => RE_ITEM.exec(s.trim())).filter(Boolean);
  const bytes = items.reduce((total, m) => total + bytesDeItem(fixture, m[1], m[2], m[3]), 0);
  return { pasos, archivos: items.length, bytes };
}

const estadoDe = (texto) => RE_ESTADO.exec(texto.split('\n')[1] ?? '')?.[1];

// Decisión (F42, task-10): los topes de contexto cambian el veredicto y van en «Motivos»; el formato de la plantilla
// va aparte, en «Formato ajeno a los topes», y no cambia el veredicto. Evidencia: en la corrida de Claude Code el único
// rechazo era de plantilla (secciones, comillas de «Tocar») con topes cumplidos; contarlo como FALLA mediría la skill
// de formato y no los topes. La sección queda visible en el informe para que Franco la vea.
const PREFIJOS_TOPE = [
  '«Pasos» debe tener', '«Criterios de aceptación» debe tener', '«Tocar» debe tener entre', '«Leer» tiene',
  'El contexto a leer mide', 'El rango de «Leer»', 'El archivo de Leer', 'Hay más de una línea «- Leer:»',
  'La línea «Leer» tiene formato inválido',
];
const esTope = (motivo) => PREFIJOS_TOPE.some((p) => motivo.startsWith(p));
const TOPE_TOCAR = 3;

// Rutas de «Tocar» y su cuenta: entre comillas o sin ellas, separadas por «, » (así también cuenta las rutas sin comillas).
function tocarDe(texto) {
  const linea = texto.replace(/\r\n?/g, '\n').split('\n').find((l) => l.startsWith('- Tocar: '));
  if (linea === undefined) return 0;
  return linea.slice('- Tocar: '.length).split(',').map((s) => s.replace(/`/g, '').trim()).filter(Boolean).length;
}

// Rechazos del validador: líneas «<ruta>: <motivo>» de su salida estándar, con el nombre de la tarea.
function rechazosDe(salida, rutas) {
  const rechazos = [];
  for (const linea of salida.split('\n')) {
    const ruta = rutas.find((r) => linea.startsWith(`${r}: `));
    if (ruta !== undefined) rechazos.push({ nombre: path.basename(ruta), motivo: linea.slice(ruta.length + 2) });
  }
  return rechazos;
}

// Veredicto de una corrida: OK solo si cumple todo lo que pide la tarea 5 y ningún tope se pasa; FALLA con los motivos.
export function analizarCorrida({ dir, herramienta }) {
  const fixture = path.join(dir, 'fixture');
  const carpeta = path.join(fixture, CARPETA);
  const nombres = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter((n) => RE_TAREA.test(n)).sort() : [];
  const motivos = [];
  const formato = [];
  const filas = [];

  if (nombres.length === 0) motivos.push('no hay tareas task-*.md en features/F01-demo');

  for (const nombre of nombres) {
    const texto = fs.readFileSync(path.join(carpeta, nombre), 'utf8');
    const cifras = cifrasDe(fixture, texto);
    filas.push({ nombre, ...cifras, tocar: tocarDe(texto) });
    if (estadoDe(texto) !== 'borrador') motivos.push(`${nombre}: el estado no es borrador`);
    if (!RE_LEER.test(texto)) motivos.push(`${nombre}: no declara «- Leer:»`);
  }

  // Validador real, con el fixture como directorio actual (lee la ruta relativa de cada tarea).
  const rechazos = [];
  if (nombres.length > 0) {
    const rutas = nombres.map((n) => path.join(CARPETA, n));
    const r = spawnSync(process.execPath, [VALIDADOR, ...rutas], { cwd: fixture, encoding: 'utf8' });
    const salida = r.stdout ?? '';
    rechazos.push(...rechazosDe(salida, rutas));
    if (r.status !== 0 && rechazos.length === 0) motivos.push(`el validador sale ${r.status}: ${(salida + (r.stderr ?? '')).trim().split('\n').slice(0, 3).join(' | ')}`);
    if (/^AVISO:/m.test(salida)) motivos.push('el validador da avisos AVISO:');
  }
  for (const { nombre, motivo } of rechazos) {
    if (esTope(motivo)) motivos.push(`${nombre}: ${motivo}`);
    else formato.push(`${nombre}: ${motivo}`);
  }

  // Medición propia de «Tocar»: no depende del validador; si el validador ya lo marca como tope, no se repite.
  for (const f of filas) {
    if (f.tocar <= TOPE_TOCAR) continue;
    const yaLoMarca = rechazos.some((r) => r.nombre === f.nombre && r.motivo.startsWith('«Tocar» debe tener entre'));
    if (!yaLoMarca) motivos.push(`${f.nombre}: «Tocar» lista ${f.tocar} archivos; el tope es ${TOPE_TOCAR}.`);
  }

  // Cambios del fixture: solo bajo features/ o definitions/BACKLOG.md.
  const estado = spawnSync('git', ['-C', fixture, 'status', '--short'], { encoding: 'utf8' }).stdout ?? '';
  const fuera = estado.split('\n').filter((l) => l.trim()).map((l) => l.slice(3).trim())
    .filter((ruta) => !(ruta.startsWith('features/') || ruta === 'definitions/BACKLOG.md'));
  if (fuera.length > 0) motivos.push(`cambios fuera de features/ o definitions/BACKLOG.md: ${fuera.join(', ')}`);

  const ok = motivos.length === 0;
  const lineas = [
    `# Planificador — ${herramienta}`,
    '',
    `Veredicto: ${ok ? 'OK' : 'FALLA'}`,
    `Tareas: ${nombres.length}`,
    '',
    'Por tarea:',
    ...(filas.length ? filas.map((f) => `- ${f.nombre}: pasos ${f.pasos}; archivos a leer ${f.archivos}; bytes de contexto ${f.bytes}; archivos a tocar ${f.tocar}`) : ['- (ninguna)']),
    '',
    'Motivos:',
    ...(motivos.length ? motivos.map((m) => `- ${m}`) : ['- ninguno']),
    '',
    'Formato ajeno a los topes (aparte; no cambia el veredicto):',
    ...(formato.length ? formato.map((m) => `- ${m}`) : ['- ninguno']),
    '',
  ];
  return { ok, informe: lineas.join('\n'), motivos };
}

export function informe({ dir, herramienta }) {
  return analizarCorrida({ dir, herramienta }).informe;
}
