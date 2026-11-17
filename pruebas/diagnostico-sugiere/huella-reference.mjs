import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function huella(dir) {
  const pathspec = ['--', '.', ':(exclude,top)cambios/**'];
  const status = git(dir, ['status', '--porcelain', ...pathspec]);
  let diff = '';
  try { diff = git(dir, ['diff', 'HEAD', ...pathspec]); } catch { /* Sin HEAD, solo cuenta status. */ }
  return createHash('sha256').update(Buffer.concat([Buffer.from(status), Buffer.from(diff)])).digest('hex').slice(0, 12);
}
