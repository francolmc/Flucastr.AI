import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { checkB, checkM, checkR } from './escenarios.mjs';

test('controles negativos B/M/R rechazan un fixture sin entregables', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'escenarios-neg-'));
  for(const [name,check] of [['B',checkB],['M',checkM],['R',checkR]]) {
    const out=check(root);
    assert.equal(out.ok,false,`${name} debe rechazar salida incompleta`);
    assert.ok(out.reason.length>0);
  }
});
