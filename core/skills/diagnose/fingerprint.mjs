import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Recorre la carpeta sin seguir enlaces ni entrar en carpetas ocultas o de dependencias.
export function recorrer(dir, base, saltar, visita) {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    if (e.name.startsWith('.') || saltar.has(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta, base, saltar, visita);
    else if (e.isFile()) visita(ruta, relative(base, ruta));
  }
}

// Huella del contrato: excluye changes/ de status y diff, conservando los demás cambios.
// null si la carpeta no es la raíz de un repo o git no responde.
export function fingerprintCurrent(carpeta) {
  try {
    const opts = { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 };
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
    const paths = ['--', '.', ':(exclude,top)changes/**'];
    const top = execFileSync('git', ['-C', carpeta, 'rev-parse', '--show-toplevel'], opts).toString().trim();
    if (realpathSync(top) !== realpathSync(carpeta)) return null;
    const st = execFileSync('git', ['-C', carpeta, 'status', '--porcelain', ...paths], { ...opts, env });
    let df = Buffer.alloc(0);
    try {
      df = execFileSync('git', ['-C', carpeta, 'diff', 'HEAD', ...paths], { ...opts, env });
    } catch {
      // sin HEAD (repo recién creado): la fingerprint usa solo el estado
    }
    return createHash('sha256').update(Buffer.concat([st, df])).digest('hex').slice(0, 12);
  } catch {
    return null;
  }
}
