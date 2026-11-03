import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearRequiere, extraerRequiere, RE_REQUIERE_LINEA } from '../../scripts/formato-requiere.mjs';

test('acepta los valores válidos y devuelve sus items', () => {
  assert.deepEqual(parsearRequiere('ninguno'), { ok: true, items: [] });

  assert.deepEqual(parsearRequiere('docker, puerto:55432'), {
    ok: true,
    items: [
      { tipo: 'docker', texto: 'docker' },
      { tipo: 'puerto', valor: 55432, texto: 'puerto:55432' },
    ],
  });

  assert.deepEqual(parsearRequiere('runtime:node@24'), {
    ok: true,
    items: [{ tipo: 'runtime', nombre: 'node', version: '24', texto: 'runtime:node@24' }],
  });

  assert.deepEqual(parsearRequiere('largo:240'), {
    ok: true,
    items: [{ tipo: 'largo', valor: 240, texto: 'largo:240' }],
  });

  const todos = parsearRequiere('navegador, red, puerto:1, puerto:65535, runtime:python3@3.12.1, largo:3600');
  assert.equal(todos.ok, true);
  assert.equal(todos.items.length, 6);
});

test('rechaza los valores inválidos con un error en español', () => {
  const invalidos = [
    '',
    'Docker',
    'puerto:0',
    'puerto:70000',
    'runtime:ruby@3',
    'runtime:node',
    'largo:0',
    'docker,red',
    'docker, docker',
    'ninguno, docker',
  ];
  for (const valor of invalidos) {
    const r = parsearRequiere(valor);
    assert.equal(r.ok, false, `debería rechazar «${valor}»`);
    assert.equal(typeof r.error, 'string', `error de «${valor}»`);
    assert.ok(r.error.length > 0, `error no vacío de «${valor}»`);
  }
});

test('extraerRequiere distingue ausente, múltiple y presente', () => {
  const sinLinea = ['# task', '', '## Contexto', '- Repo: este.', '', '## Pasos', '1. Hacer.'].join('\n');
  assert.deepEqual(extraerRequiere(sinLinea), { estado: 'ausente' });

  const dos = ['## Contexto', '- Requiere: ninguno', '- Requiere: docker'].join('\n');
  assert.deepEqual(extraerRequiere(dos), { estado: 'multiple' });

  const una = ['## Contexto', '- Repo: este.', '- Requiere: docker, puerto:55432'].join('\n');
  assert.deepEqual(extraerRequiere(una), { estado: 'presente', valor: 'docker, puerto:55432' });
});

test('una línea «- Requiere:» fuera de «## Contexto» no cuenta', () => {
  const texto = [
    '## Contexto',
    '- Repo: este.',
    '',
    '## Pasos',
    '- Requiere: docker',
  ].join('\n');
  assert.deepEqual(extraerRequiere(texto), { estado: 'ausente' });
  assert.ok(RE_REQUIERE_LINEA.test('- Requiere: ninguno'));
});
