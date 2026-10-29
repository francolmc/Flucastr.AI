import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flucastr-launchers-'));
const sharedPrompt = fs.readFileSync(path.join(dir, 'prompts/existente.txt'), 'utf8').trim();
const fake = path.join(tmp, 'fake-model.sh');
const launcherOutputs = new Map();
fs.writeFileSync(fake, '#!/usr/bin/env bash\nprintf \'%s\\n\' "$@"\n', { mode: 0o755 });

for (const [tool, script, variable, expected] of [
  ['Claude Code', 'lanzar-claude.sh', 'FLUCASTR_CLAUDE_BIN', ['--agent', 'arquitecto', '--output-format', 'stream-json', 'Bash(git -C ./api remote -v)', 'Write(./definicion/**)', sharedPrompt]],
  ['Pi', 'lanzar-pi.sh', 'FLUCASTR_PI_BIN', ['--mode', 'json', '--no-session', '-p', sharedPrompt]],
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
    launcherOutputs.set(tool, output);
    for (const arg of expected) assert.ok(output.includes(arg), `falta argumento esperado: ${arg}\n${output}`);
    assert.ok(output.split(/\r?\n/).includes(sharedPrompt), 'el prompt compartido debe ser un único argumento completo');
  });
}

test('Claude Code y Pi reciben exactamente la misma definición compartida del prompt', () => {
  const claude = launcherOutputs.get('Claude Code')?.split(/\r?\n/).filter(Boolean) ?? [];
  const pi = launcherOutputs.get('Pi')?.split(/\r?\n/).filter(Boolean) ?? [];
  assert.ok(claude.includes(sharedPrompt), 'Claude Code no recibió el prompt compartido');
  assert.ok(pi.includes(sharedPrompt), 'Pi no recibió el prompt compartido');
  assert.equal(claude.filter(arg => arg === sharedPrompt).length, 1);
  assert.equal(pi.filter(arg => arg === sharedPrompt).length, 1);
});
