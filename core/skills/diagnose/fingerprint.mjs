import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from 'node:fs';
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

// Contenido que cuenta para la huella de un archivo sin seguimiento.
// Archivo regular: su contenido. Enlace: su destino (no se sigue). Otra cosa (dispositivo, socket, FIFO): null,
// porque leerla puede bloquearse o cambiar sin que cambie el repo; git status ya la nombra y eso sí queda en la huella.
function contenidoSinSeguimiento(ruta) {
  const st = lstatSync(ruta);
  if (st.isSymbolicLink()) return { tipo: 'enlace', datos: Buffer.from(readlinkSync(ruta)) };
  if (st.isFile()) return { tipo: 'archivo', datos: readFileSync(ruta) };
  return null;
}

// Huella del contrato (core/contracts/verification.md, «Fingerprint»). Excluye changes/ del repo.
// Cuenta: git status -uall, git diff HEAD (si hay HEAD) y, por cada archivo sin seguimiento no ignorado,
// su ruta, su tipo y el sha256 de su contenido, en orden de ruta. Se devuelven 12 hex.
// null si la carpeta no es la raíz de un repo, git no responde o un archivo no se puede leer.
export function fingerprintCurrent(carpeta) {
  try {
    const opts = { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 };
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
    const paths = ['--', '.', ':(exclude,top)changes/**'];
    const top = execFileSync('git', ['-C', carpeta, 'rev-parse', '--show-toplevel'], opts).toString().trim();
    if (realpathSync(top) !== realpathSync(carpeta)) return null;
    const st = execFileSync('git', ['-C', carpeta, 'status', '--porcelain', '-uall', ...paths], { ...opts, env });
    let df = Buffer.alloc(0);
    try {
      df = execFileSync('git', ['-C', carpeta, 'diff', 'HEAD', ...paths], { ...opts, env });
    } catch {
      // sin HEAD (repo recién creado): la huella usa el estado y los contenidos sin seguimiento
    }
    const sinSeguimiento = execFileSync('git', ['-C', carpeta, 'ls-files', '-z', '--others', '--exclude-standard', ...paths], { ...opts, env })
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
      .sort();
    const h = createHash('sha256').update(Buffer.concat([st, df]));
    for (const rel of sinSeguimiento) {
      const c = contenidoSinSeguimiento(join(carpeta, rel));
      if (c === null) continue;
      const sha = createHash('sha256').update(c.datos).digest('hex');
      h.update(`${rel}\0${c.tipo}\0${sha}\n`);
    }
    return h.digest('hex').slice(0, 12);
  } catch {
    return null;
  }
}
