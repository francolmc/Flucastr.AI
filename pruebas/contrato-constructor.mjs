#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const skill = readFileSync(new URL('../skills/ejecutar-plan/SKILL.md', import.meta.url), 'utf8');
const matches = [...skill.matchAll(/```bash pendientes-plan\n([\s\S]*?)\n```/g)];
assert.equal(matches.length, 1, 'debe existir exactamente un bloque canónico bash pendientes-plan');
const block = matches[0][1];
const cases = [
  { id: 'A1', content: '- [x] hecho\n  - [ ] ejemplo en evidencia\n', status: 0, stdout: '0\n' },
  { id: 'A2', content: '- [ ] pendiente uno\n- [x] completo\n  - [ ] checkbox indentado\n- [ ] pendiente dos\n', status: 0, stdout: '2\n' },
  { id: 'A3', missing: true, nonzero: true },
];

const dir = mkdtempSync(join(tmpdir(), 'contrato-constructor-'));
try {
  function run(script, file) {
    const scriptPath = join(dir, 'pendientes.sh');
    writeFileSync(scriptPath, script);
    return spawnSync('bash', ['-e', scriptPath, file], { encoding: 'utf8' });
  }
  function evaluateCases(items, script = block) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('lista de casos vacía');
    return items.map(item => {
      const file = join(dir, `${item.id}.md`);
      if (!item.missing) writeFileSync(file, item.content);
      const result = run(script, file);
      assert.equal(result.error, undefined, `${item.id}: error al iniciar bash: ${result.error}`);
      assert.equal(result.signal, null, `${item.id}: bash terminó por señal ${result.signal}`);
      assert.notEqual(result.status, null, `${item.id}: bash no produjo código de salida`);
      if (item.nonzero) assert.notEqual(result.status, 0, `${item.id}: ruta ilegible no debe producir éxito`);
      else assert.equal(result.status, item.status, `${item.id}: exit inesperado (${result.status}): ${result.stderr}`);
      if (item.stdout !== undefined) assert.equal(result.stdout, item.stdout, `${item.id}: stdout inesperado`);
      return result;
    });
  }

  evaluateCases(cases);
  for (const item of cases) console.log(`ok ${item.id}`);
  assert.throws(() => evaluateCases([], block), /lista de casos vacía/, 'A5: un evaluador vacío debe fallar explícitamente');
  console.log('ok A5');

  const mutated = block.replace(/awk '[\s\S]*?' "\$1"/, `grep -c '^- \\[ \\]' "$1"`);
  assert.notEqual(mutated, block, 'no se encontró el evaluador awk para aplicar mutación de sensibilidad');
  assert.throws(
    () => evaluateCases([cases[0]], mutated),
    error => error instanceof assert.AssertionError && /A1: exit inesperado/.test(error.message),
    'A4: el mismo evaluador debe rechazar el mutante por exit inesperado de A1',
  );
  console.log('ok A4');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
