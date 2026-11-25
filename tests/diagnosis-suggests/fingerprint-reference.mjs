import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import path from 'node:path';

// Referencia independiente de la huella del contrato (core/contracts/verification.md, «Fingerprint»).
// Debe dar lo mismo que core/skills/diagnose/fingerprint.mjs; las pruebas comparan ambas.
function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function fingerprint(dir) {
  const pathspec = ['--', '.', ':(exclude,top)changes/**'];
  const status = git(dir, ['status', '--porcelain', '-uall', ...pathspec]);
  let diff = '';
  try { diff = git(dir, ['diff', 'HEAD', ...pathspec]); } catch { /* Sin HEAD, solo cuentan status y sin seguimiento. */ }
  const h = createHash('sha256').update(Buffer.concat([Buffer.from(status), Buffer.from(diff)]));
  const rutas = git(dir, ['ls-files', '-z', '--others', '--exclude-standard', ...pathspec]).split('\0').filter(Boolean).sort();
  for (const rel of rutas) {
    const ruta = path.join(dir, rel);
    const st = lstatSync(ruta);
    let tipo;
    let datos;
    if (st.isSymbolicLink()) { tipo = 'enlace'; datos = Buffer.from(readlinkSync(ruta)); }
    else if (st.isFile()) { tipo = 'archivo'; datos = readFileSync(ruta); }
    else continue; // dispositivos, sockets y FIFO no cuentan para el contenido
    h.update(`${rel}\0${tipo}\0${createHash('sha256').update(datos).digest('hex')}\n`);
  }
  return h.digest('hex').slice(0, 12);
}
