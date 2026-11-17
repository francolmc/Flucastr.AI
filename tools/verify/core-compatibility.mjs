import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const inventoryRelativePath = 'tools/core-compatibility.json';

function checkedPath(root, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new Error('la ruta debe ser una cadena no vacía');
  }
  if (path.posix.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath) || relativePath.includes('\\')) {
    throw new Error(`ruta absoluta o no portable: ${relativePath}`);
  }
  const components = relativePath.split('/');
  if (components.some(component => component === '..' || component === '')) {
    throw new Error(`ruta no permitida: ${relativePath}`);
  }

  const normalized = path.posix.normalize(relativePath);
  const absolute = path.resolve(root, ...components);
  const relative = path.relative(root, absolute);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`ruta fuera del repositorio: ${relativePath}`);
  }
  return { absolute, normalized };
}

function lstatWithoutSymlinks(root, absolute, relativePath) {
  let current = root;
  const components = path.relative(root, absolute).split(path.sep);
  for (let i = 0; i < components.length; i++) {
    current = path.join(current, components[i]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        throw new Error(`ruta faltante: ${relativePath}`);
      }
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`enlace simbólico no permitido: ${relativePath}`);
    if (i < components.length - 1 && !stat.isDirectory()) {
      throw new Error(`componente no es directorio: ${relativePath}`);
    }
    if (i === components.length - 1 && !stat.isFile()) {
      throw new Error(`no es archivo regular: ${relativePath}`);
    }
  }
  return fs.lstatSync(absolute);
}

function readRegularFile(absolute, relativePath) {
  const noFollow = fs.constants.O_NOFOLLOW ?? 0;
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | noFollow);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error(`no es archivo regular: ${relativePath}`);
    return { bytes: fs.readFileSync(fd), mode: stat.mode & 0o111 };
  } finally {
    fs.closeSync(fd);
  }
}

export function checkCoreCompatibility(repositoryRoot) {
  const root = fs.realpathSync(repositoryRoot);
  const inventoryPath = checkedPath(root, inventoryRelativePath);
  lstatWithoutSymlinks(root, inventoryPath.absolute, inventoryRelativePath);
  const inventory = JSON.parse(fs.readFileSync(inventoryPath.absolute, 'utf8'));
  if (!Array.isArray(inventory)) throw new Error('el inventario debe ser un arreglo');

  const pairs = [];
  const seen = new Set();
  for (let index = 0; index < inventory.length; index++) {
    const pair = inventory[index];
    if (!pair || typeof pair !== 'object' || Array.isArray(pair) ||
        Object.keys(pair).sort().join(',') !== 'compatibility,source') {
      throw new Error(`par ${index + 1}: se requieren solo source y compatibility`);
    }
    const source = checkedPath(root, pair.source);
    const compatibility = checkedPath(root, pair.compatibility);
    for (const entry of [source, compatibility]) {
      if (seen.has(entry.normalized)) throw new Error(`ruta duplicada: ${entry.normalized}`);
      seen.add(entry.normalized);
    }
    pairs.push({ source, compatibility, index });
  }

  // Confirma todas las rutas y sus componentes antes de abrir cualquier contenido.
  const validated = pairs.map(({ source, compatibility, index }) => ({
    source,
    compatibility,
    index,
    sourceStat: lstatWithoutSymlinks(root, source.absolute, source.normalized),
    compatibilityStat: lstatWithoutSymlinks(root, compatibility.absolute, compatibility.normalized),
  }));

  for (const pair of validated) {
    const source = readRegularFile(pair.source.absolute, pair.source.normalized);
    const compatibility = readRegularFile(pair.compatibility.absolute, pair.compatibility.normalized);
    if (!source.bytes.equals(compatibility.bytes)) {
      throw new Error(`par ${pair.index + 1}: contenido distinto (${pair.source.normalized}, ${pair.compatibility.normalized})`);
    }
    if (source.mode !== compatibility.mode) {
      throw new Error(`par ${pair.index + 1}: permisos ejecutables distintos (${pair.source.normalized}, ${pair.compatibility.normalized})`);
    }
  }
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const repositoryRoot = path.resolve(path.dirname(scriptPath), '../..');
  try {
    checkCoreCompatibility(repositoryRoot);
  } catch (error) {
    console.error(`FALLO: compatibilidad core: ${error.message}`);
    process.exitCode = 1;
  }
}
