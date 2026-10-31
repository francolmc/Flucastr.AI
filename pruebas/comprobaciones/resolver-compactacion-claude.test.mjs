import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RESOLVER = join(RAIZ_REPO, 'scripts', 'resolver.mjs');
const temporales = [];
after(() => {
  for (const d of temporales) rmSync(d, { recursive: true, force: true });
});

// Carpeta temporal propia de cada caso (nunca ~/.claude ni ~/.pi).
function carpeta() {
  const dir = mkdtempSync(join(tmpdir(), 'flucastr-compactacion-claude-'));
  temporales.push(dir);
  return dir;
}

// modelos.json temporal: copia del real, con los cambios que pida `modificar`.
function modelosTemporal(modificar = () => {}) {
  const c = JSON.parse(readFileSync(join(RAIZ_REPO, 'modelos.json'), 'utf8'));
  modificar(c);
  const ruta = join(carpeta(), 'modelos.json');
  writeFileSync(ruta, JSON.stringify(c, null, 2) + '\n');
  return ruta;
}
const MODELOS = modelosTemporal();

// Ejecuta el resolver con FLUCASTR_MODELOS apuntando a un modelos.json temporal.
function resolver(args, modelos = MODELOS) {
  const env = { ...process.env, FLUCASTR_MODELOS: modelos };
  return spawnSync('node', [RESOLVER, ...args], { encoding: 'utf8', timeout: 30000, env });
}

function leer(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

function leerTexto(ruta) {
  return readFileSync(ruta, 'utf8');
}

function escribir(ruta, objeto) {
  writeFileSync(ruta, JSON.stringify(objeto, null, 2) + '\n');
}

// `despues` conserva todo lo de `antes`: en objetos, cada clave sigue con su valor (puede haber claves nuevas dentro).
function contiene(despues, antes) {
  if (antes !== null && typeof antes === 'object' && !Array.isArray(antes)) {
    if (despues === null || typeof despues !== 'object') return false;
    return Object.keys(antes).every(k => k in despues && contiene(despues[k], antes[k]));
  }
  return JSON.stringify(despues) === JSON.stringify(antes);
}

// Claves de primer nivel de `antes` que cambiaron o faltan en `despues`.
function ajenasIntactas(antes, despues) {
  return Object.keys(antes)
    .filter(k => !(k in despues) || !contiene(despues[k], antes[k]))
    .sort();
}

// --- 1. Carpeta nueva ---
test('1. carpeta nueva: fijado:133000, contenido exacto y repetir da ya-estaba sin tocar el archivo', () => {
  const ruta = join(carpeta(), 'a', 'settings.local.json');
  const r = resolver(['fijar-compactacion', 'claude', ruta]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, 'fijado:133000\n');
  assert.deepEqual(leer(ruta), { autoCompactWindow: 133000 });
  assert.equal(leerTexto(ruta), JSON.stringify({ autoCompactWindow: 133000 }, null, 2) + '\n');

  const bytes = readFileSync(ruta);
  const again = resolver(['fijar-compactacion', 'claude', ruta]);
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.stdout, 'ya-estaba\n');
  assert.ok(readFileSync(ruta).equals(bytes), 'el archivo cambió al repetir');
});

// --- 2. El valor sigue a modelos.json ---
test('2. el valor sigue a modelos.json: global 150000 da 183000; override de perfil 120000 da 153000', () => {
  const globalTemp = modelosTemporal(c => { c.compactar_en = 150000; });
  const ruta1 = join(carpeta(), 'settings.local.json');
  const r1 = resolver(['fijar-compactacion', 'claude', ruta1], globalTemp);
  assert.equal(r1.status, 0, r1.stderr);
  assert.equal(r1.stdout, 'fijado:183000\n');
  assert.deepEqual(leer(ruta1), { autoCompactWindow: 183000 });

  const perfilTemp = modelosTemporal(c => { c.compactar_en = 100000; c.perfiles['claude-code'].compactar_en = 120000; });
  const ruta2 = join(carpeta(), 'settings.local.json');
  const r2 = resolver(['fijar-compactacion', 'claude', ruta2], perfilTemp);
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.stdout, 'fijado:153000\n');
  assert.deepEqual(leer(ruta2), { autoCompactWindow: 153000 });
});

// --- 3. Rango y umbral ---
test('3. rango: fuera de 100000-1000000 se omite con aviso y no se escribe', () => {
  const casos = [
    { nombre: 'compactar_en 50000 (83000)', modelos: modelosTemporal(c => { c.compactar_en = 50000; }), linea: 'omitido-rango:83000\n' },
    { nombre: 'compactar_en 980000 (1013000)', modelos: modelosTemporal(c => { c.compactar_en = 980000; }), linea: 'omitido-rango:1013000\n' },
  ];
  for (const caso of casos) {
    const ruta = join(carpeta(), 'settings.local.json');
    const r = resolver(['fijar-compactacion', 'claude', ruta], caso.modelos);
    assert.equal(r.status, 0, `${caso.nombre}: ${r.stderr}`);
    assert.equal(r.stdout, caso.linea, caso.nombre);
    assert.equal(existsSync(ruta), false, `${caso.nombre}: se escribió el archivo`);
  }

  const sinUmbral = [
    modelosTemporal(c => { delete c.compactar_en; }),
    modelosTemporal(c => { c.compactar_en = 'abc'; }),
  ];
  for (const modelos of sinUmbral) {
    const ruta = join(carpeta(), 'settings.local.json');
    const r = resolver(['fijar-compactacion', 'claude', ruta], modelos);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, 'omitido-umbral\n');
    assert.equal(existsSync(ruta), false);
  }

  // Control positivo: el mismo caso con un valor dentro de rango no sale omitido-rango.
  const dentro = modelosTemporal(c => { c.compactar_en = 100000; });
  const rDentro = resolver(['fijar-compactacion', 'claude', join(carpeta(), 'settings.local.json')], dentro);
  assert.equal(rDentro.stdout, 'fijado:133000\n');
  assert.notEqual(rDentro.stdout, 'omitido-rango:133000\n');
});

// --- 4. No pisar al usuario ---
test('4. no pisa: otro autoCompactWindow se respeta; el mismo valor da ya-estaba; modelSettings se conserva', () => {
  const ruta1 = join(carpeta(), 'settings.local.json');
  writeFileSync(ruta1, JSON.stringify({ autoCompactWindow: 150000, otra: 1 }, null, 2) + '\n');
  const antes1 = readFileSync(ruta1);
  const r1 = resolver(['fijar-compactacion', 'claude', ruta1]);
  assert.equal(r1.status, 0, r1.stderr);
  assert.equal(r1.stdout, 'omitido-usuario\n');
  assert.ok(readFileSync(ruta1).equals(antes1), 'el archivo del usuario cambió');

  const ruta2 = join(carpeta(), 'settings.local.json');
  escribir(ruta2, { autoCompactWindow: 133000 });
  const antes2 = readFileSync(ruta2);
  const r2 = resolver(['fijar-compactacion', 'claude', ruta2]);
  assert.equal(r2.stdout, 'ya-estaba\n');
  assert.ok(readFileSync(ruta2).equals(antes2), 'el archivo cambió con ya-estaba');

  const ruta3 = join(carpeta(), 'settings.local.json');
  escribir(ruta3, { modelSettings: { x: 1 } });
  const r3 = resolver(['fijar-compactacion', 'claude', ruta3]);
  assert.equal(r3.status, 0, r3.stderr);
  assert.equal(r3.stdout, 'fijado:133000\n');
  assert.deepEqual(leer(ruta3), { modelSettings: { x: 1 }, autoCompactWindow: 133000 });
});

// --- 5. Convivencia con fijar-agente / quitar-agente ---
test('5. convivencia: fijar-agente, fijar-compactacion, quitar-compactacion y quitar-agente se pisan sin borrar lo ajeno', () => {
  const ruta = join(carpeta(), 'settings.local.json');
  const f1 = resolver(['fijar-agente', ruta, 'coordinador']);
  assert.equal(f1.stdout, 'fijado\n');
  const f2 = resolver(['fijar-compactacion', 'claude', ruta]);
  assert.equal(f2.stdout, 'fijado:133000\n');
  assert.deepEqual(leer(ruta), { agent: 'coordinador', autoCompactWindow: 133000 });

  const q1 = resolver(['quitar-compactacion', 'claude', ruta, '133000']);
  assert.equal(q1.stdout, 'quitado\n');
  assert.deepEqual(leer(ruta), { agent: 'coordinador' });

  const q2 = resolver(['quitar-agente', ruta, 'coordinador']);
  assert.equal(q2.stdout, 'archivo-quitado\n');
  assert.equal(existsSync(ruta), false);
});

// --- 6. Quitar ---
test('6. quitar: valor distinto u archivo inexistente dan omitido; si queda vacío se borra', () => {
  const ruta = join(carpeta(), 'settings.local.json');
  escribir(ruta, { autoCompactWindow: 133000, otra: 1 });
  const antes = readFileSync(ruta);
  const distinto = resolver(['quitar-compactacion', 'claude', ruta, '150000']);
  assert.equal(distinto.status, 0, distinto.stderr);
  assert.equal(distinto.stdout, 'omitido\n');
  assert.ok(readFileSync(ruta).equals(antes), 'el archivo cambió con valor distinto');

  const inexistente = join(carpeta(), 'no-existe', 'settings.local.json');
  const noExiste = resolver(['quitar-compactacion', 'claude', inexistente, '133000']);
  assert.equal(noExiste.stdout, 'omitido\n');
  assert.equal(existsSync(inexistente), false);

  const solo = join(carpeta(), 'settings.local.json');
  escribir(solo, { autoCompactWindow: 133000 });
  const vacio = resolver(['quitar-compactacion', 'claude', solo, '133000']);
  assert.equal(vacio.status, 0, vacio.stderr);
  assert.equal(vacio.stdout, 'archivo-quitado\n');
  assert.equal(existsSync(solo), false);
});

// --- 7. JSON inválido y --simular ---
test('7. JSON inválido sale con exit 1 sin tocar el archivo; --simular imprime lo mismo sin escribir', () => {
  const ruta = join(carpeta(), 'settings.local.json');
  writeFileSync(ruta, '{"otra":');
  const antes = readFileSync(ruta);
  const r = resolver(['fijar-compactacion', 'claude', ruta]);
  assert.equal(r.status, 1);
  assert.ok(readFileSync(ruta).equals(antes), 'el JSON inválido se tocó');

  const dir = carpeta();
  const sim = resolver(['fijar-compactacion', 'claude', join(dir, 'a', 'settings.local.json'), '--simular']);
  assert.equal(sim.status, 0, sim.stderr);
  assert.equal(sim.stdout, 'fijado:133000\n');
  assert.deepEqual(readdirSync(dir), [], '--simular creó algo');
});

// --- 8. Avisos de comparar-modelos ---
test('8. comparar-modelos: avisa campos nuevos, nada entre iguales y perfil nuevo sin campo nuevo', () => {
  const personal = modelosTemporal(c => {
    delete c.compactar_en;
    delete c.perfiles['pi-openai'].ventanas;
  });
  const campos = resolver(['comparar-modelos', personal, MODELOS]);
  assert.equal(campos.status, 0, campos.stderr);
  assert.equal(campos.stdout, 'campo nuevo: compactar_en\ncampo nuevo: ventanas (perfil pi-openai)\n');

  const iguales = resolver(['comparar-modelos', MODELOS, MODELOS]);
  assert.equal(iguales.status, 0, iguales.stderr);
  assert.equal(iguales.stdout, '');

  const publicado = modelosTemporal(c => {
    c.perfiles.nuevo = {
      herramienta: 'pi',
      proveedor: 'x',
      modelos: { alto: 'x/a', medio: 'x/a', bajo: 'x/a' },
      ventanas: { 'x/a': 1000 },
    };
  });
  const nuevo = resolver(['comparar-modelos', MODELOS, publicado]);
  assert.equal(nuevo.status, 0, nuevo.stderr);
  assert.equal(nuevo.stdout, 'perfil nuevo: nuevo\n');
});

// --- 9. Controles negativos ---
test('9a. control: ajenasIntactas da [] con el resultado real de los casos 4 y 5 y lista exacta con una copia dañada', () => {
  // Caso 4: archivo del usuario que el resolver no debe tocar.
  const ruta4 = join(carpeta(), 'settings.local.json');
  const antes4 = { autoCompactWindow: 150000, otra: 1 };
  escribir(ruta4, antes4);
  resolver(['fijar-compactacion', 'claude', ruta4]);
  assert.deepEqual(ajenasIntactas(antes4, leer(ruta4)), []);

  // Caso 5: convivencia con el agente.
  const ruta5 = join(carpeta(), 'settings.local.json');
  resolver(['fijar-agente', ruta5, 'coordinador']);
  const antes5 = leer(ruta5);
  resolver(['fijar-compactacion', 'claude', ruta5]);
  assert.deepEqual(ajenasIntactas(antes5, leer(ruta5)), []);

  // Copia dañada a propósito: se borra agent y cambia otra.
  const antesDañada = { agent: 'coordinador', otra: 1, autoCompactWindow: 133000 };
  const despuesDañada = { otra: 2, autoCompactWindow: 133000 };
  assert.deepEqual(ajenasIntactas(antesDañada, despuesDañada), ['agent', 'otra']);
});

test('9b. control: el caso de rango distingue un valor inválido de uno válido', () => {
  const invalido = resolver(['fijar-compactacion', 'claude', join(carpeta(), 'settings.local.json')],
    modelosTemporal(c => { c.compactar_en = 50000; }));
  assert.equal(invalido.stdout, 'omitido-rango:83000\n');
  const valido = resolver(['fijar-compactacion', 'claude', join(carpeta(), 'settings.local.json')],
    modelosTemporal(c => { c.compactar_en = 100000; }));
  assert.equal(valido.stdout, 'fijado:133000\n');
  assert.notEqual(valido.stdout, 'omitido-rango:133000\n');
});
