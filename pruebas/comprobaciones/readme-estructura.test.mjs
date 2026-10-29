import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validarReadme } from './readme-estructura.mjs';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

// README mínimo: dos agentes y dos skills en el árbol de «## Estructura».
const README_VALIDO = [
  '# Prueba',
  '',
  '## Estructura',
  '',
  '```',
  'Prueba/',
  '├── README.md',
  '├── agentes/         # un archivo por agente',
  '│   ├── a.md    # primero',
  '│   └── b.md    # segundo',
  '├── skills/          # procedimientos',
  '│   ├── x/',
  '│   └── y/',
  '└── instalar.sh      # instala',
  '```',
  '',
].join('\n');

const AGENTES_VALIDOS = ['a.md', 'b.md'];
const SKILLS_VALIDAS = ['x', 'y'];

test('muestra válida: no hay errores', () => {
  assert.deepEqual(validarReadme({ readme: README_VALIDO, agentes: AGENTES_VALIDOS, skills: SKILLS_VALIDAS }), []);
});

test('variante: falta un agente en el README', () => {
  const errores = validarReadme({ readme: README_VALIDO, agentes: ['a.md', 'b.md', 'c.md'], skills: SKILLS_VALIDAS });
  assert.ok(errores.some((e) => e.includes('c.md')), errores.join('\n'));
});

test('variante: falta una skill en el README', () => {
  const errores = validarReadme({ readme: README_VALIDO, agentes: AGENTES_VALIDOS, skills: ['x', 'y', 'z'] });
  assert.ok(errores.some((e) => e.includes('«z»')), errores.join('\n'));
});

test('variante: sobra un agente en el README', () => {
  const errores = validarReadme({ readme: README_VALIDO, agentes: ['a.md'], skills: SKILLS_VALIDAS });
  assert.ok(errores.some((e) => e.includes('b.md')), errores.join('\n'));
});

test('variante: sobra una skill en el README', () => {
  const errores = validarReadme({ readme: README_VALIDO, agentes: AGENTES_VALIDOS, skills: ['x'] });
  assert.ok(errores.some((e) => e.includes('«y»')), errores.join('\n'));
});

test('variante: README sin sección «## Estructura»', () => {
  const sinSeccion = README_VALIDO.replace('## Estructura', '## Otra cosa');
  const errores = validarReadme({ readme: sinSeccion, agentes: AGENTES_VALIDOS, skills: SKILLS_VALIDAS });
  assert.ok(errores.some((e) => e.includes('«## Estructura»')), errores.join('\n'));
});

test('repo real: README, agentes/ y skills/ coinciden', () => {
  const readme = fs.readFileSync(`${RAIZ}README.md`, 'utf8');
  const agentes = fs.readdirSync(`${RAIZ}agentes`).filter((n) => n.endsWith('.md'));
  const skills = fs
    .readdirSync(`${RAIZ}skills`, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  assert.ok(agentes.length >= 4, `se esperaban al menos 4 agentes y hay ${agentes.length}`);
  assert.ok(skills.length >= 7, `se esperaban al menos 7 skills y hay ${skills.length}`);
  assert.deepEqual(validarReadme({ readme, agentes, skills }), []);
});
