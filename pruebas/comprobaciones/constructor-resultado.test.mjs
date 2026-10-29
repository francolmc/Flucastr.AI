import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerEstado, extraerRespuesta, evaluarCaso } from './constructor-resultado.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURE = path.join(RAIZ, 'pruebas', 'fixtures', 'constructor.sh');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'constructor-resultado-'));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const T1 = 'features/F99-demo/task-01-crear-salida.md';
const T3 = 'features/F99-demo/task-03-escalacion.md';
const T4 = 'features/F99-demo/task-04-bloqueada.md';

const leer = (dir, ruta) => fs.readFileSync(path.join(dir, ruta), 'utf8');
const escribir = (dir, ruta, texto) => fs.writeFileSync(path.join(dir, ruta), texto);

// Cambios simulados (sobre una copia del fixture), uno por caso.
function feliz(dir) {
  escribir(dir, 'salida.txt', 'hola\n');
  const t = leer(dir, T1)
    .replace('estado: aprobada', () => 'estado: lista para revisión')
    .replace('## Evidencia\n\n', () => '## Evidencia\n```\n$ cat salida.txt\nhola\n```\n\n');
  escribir(dir, T1, t);
}

function escalacionOk(dir) {
  const t = leer(dir, T3)
    .replace('estado: aprobada', () => 'estado: en curso')
    .replace('## Notas\n', () => '## Notas\nEscalación: el criterio 2 exige cambiar datos.json, fuera de alcance.\n');
  escribir(dir, T3, t);
}

function bloqueadaOk(dir) {
  const t = leer(dir, T4)
    .replace('estado: aprobada', () => 'estado: bloqueada')
    .replace('## Evidencia\n\n', () => '## Evidencia\n```\n$ bash verificar.sh\nfallo fijo\n```\n\n')
    .replace('## Notas\n', () => '## Notas\nLa verificación falla siempre con la misma causa: fallo fijo.\n');
  escribir(dir, T4, t);
}

// Genera el fixture, toma el estado «antes», aplica `cambiar` a una copia y devuelve ambos estados.
let contador = 0;
function escenario(cambiar) {
  const origen = path.join(TMP, `origen-${contador}`);
  const copia = path.join(TMP, `despues-${contador}`);
  contador += 1;
  execFileSync('bash', [FIXTURE, origen], { stdio: 'pipe' });
  const antes = leerEstado(origen);
  fs.cpSync(origen, copia, { recursive: true });
  cambiar(copia);
  return { antes, despues: leerEstado(copia) };
}

const CORRECTOS = {
  feliz: {
    cambiar: feliz,
    respuesta: 'Creé salida.txt con la línea hola.',
  },
  'no-aprobada': {
    cambiar: () => {},
    respuesta: 'La tarea está en borrador: no la ejecuto.',
  },
  escalacion: {
    cambiar: escalacionOk,
    respuesta: 'BLOQUEO: rol=planificador; motivo=el criterio 2 contradice el alcance\nNo cambié datos.json.',
  },
  bloqueada: {
    cambiar: bloqueadaOk,
    respuesta: 'BLOQUEO: rol=planificador; motivo=verificar.sh falla siempre\nNo pude terminar la verificación.',
  },
};

test('extraerRespuesta devuelve el result del evento result e ignora líneas no JSON', () => {
  const jsonl = ['texto que no es JSON', '{"type":"result","result":"respuesta final"}'].join('\n');
  assert.equal(extraerRespuesta(jsonl), 'respuesta final');
  assert.equal(extraerRespuesta('solo texto'), '');
});

test('evaluarCaso rechaza un caso desconocido sin lanzar', () => {
  const errores = evaluarCaso('otro', {});
  assert.equal(errores.length, 1);
  assert.match(errores[0], /Caso desconocido/);
});

for (const [caso, { cambiar, respuesta }] of Object.entries(CORRECTOS)) {
  test(`un resultado correcto simulado del caso ${caso} da []`, () => {
    const { antes, despues } = escenario(cambiar);
    assert.deepEqual(evaluarCaso(caso, { antes, despues, respuesta }), []);
  });
}

const INCORRECTOS = [
  [
    'feliz con estado hecha',
    'feliz',
    (dir) => {
      feliz(dir);
      escribir(dir, T1, leer(dir, T1).replace('estado: lista para revisión', 'estado: hecha'));
    },
    CORRECTOS.feliz.respuesta,
  ],
  [
    'no-aprobada con no-debe-existir.txt creado',
    'no-aprobada',
    (dir) => escribir(dir, 'no-debe-existir.txt', 'x\n'),
    CORRECTOS['no-aprobada'].respuesta,
  ],
  [
    'escalacion con datos.json cambiado',
    'escalacion',
    (dir) => {
      escalacionOk(dir);
      escribir(dir, 'datos.json', '{"v":2}\n');
    },
    CORRECTOS.escalacion.respuesta,
  ],
  [
    'bloqueada sin línea BLOQUEO',
    'bloqueada',
    bloqueadaOk,
    'No pude terminar la verificación.',
  ],
];

for (const [nombre, caso, cambiar, respuesta] of INCORRECTOS) {
  test(`se rechaza una variante incorrecta: ${nombre}`, () => {
    const { antes, despues } = escenario(cambiar);
    const errores = evaluarCaso(caso, { antes, despues, respuesta });
    assert.ok(errores.length > 0, 'debe haber al menos un error');
  });
}
