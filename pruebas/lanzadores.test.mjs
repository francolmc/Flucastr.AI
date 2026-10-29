import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flucastr-launchers-'));
const fake = path.join(tmp, 'fake-model.sh');
fs.writeFileSync(fake, '#!/usr/bin/env bash\nprintf \'%s\\n\' "$@"\n', { mode: 0o755 });

for (const [tool, script, variable, expected] of [
  ['Claude Code', 'lanzar-claude.sh', 'FLUCASTR_CLAUDE_BIN', ['--agent', 'arquitecto', '--output-format', 'stream-json', 'Bash(git -C ./api remote -v)', 'Write(./definicion/**)', 'El proyecto ya existe. Revísalo y dame arquitectura, repos y script para clonarlo.']],
  ['Pi', 'lanzar-pi.sh', 'FLUCASTR_PI_BIN', ['--mode', 'json', '--no-session', '-p', 'El proyecto ya existe. Revísalo y dame arquitectura, repos y script para clonarlo.']],
]) {
  test(`${script}: sintaxis Bash válida`, () => {
    const result = spawnSync('/bin/bash', ['-n', path.join(dir, script)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  });

  test(`${script}: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE`, () => {
    const record = path.join(tmp, `${tool.replaceAll(' ', '-')}.record`);
    const result = spawnSync('/bin/bash', [path.join(dir, script)], {
      cwd: tmp, encoding: 'utf8', env: { ...process.env, [variable]: fake, FLUCASTR_RECORD_FILE: record },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(record), 'el lanzador no creó el registro indicado');
    const output = fs.readFileSync(record, 'utf8');
    for (const arg of expected) assert.ok(output.includes(arg), `falta argumento esperado: ${arg}\n${output}`);
  });
}
