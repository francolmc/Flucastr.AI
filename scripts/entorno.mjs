#!/usr/bin/env node
// Puerta de entorno (F31, task-04): comprueba los items de «- Requiere:» de una tarea con sondas, sin modificar nada.
//
// Uso:
//   node scripts/entorno.mjs <ruta-tarea>
//   node scripts/entorno.mjs --sugerir <ruta-tarea>   (propone la línea Requiere: desde Verificación; no sondea ni escribe)
//
// Salida 0: imprime «ok», o «aviso: la tarea no declara Requiere» si no hay línea (no bloquea).
// Salida 1: imprime una sola línea «falta=<items separados por ,>» en el orden de la tarea.
// Salida 2: uso, archivo ilegible, línea inválida o «Requiere:» repetida (mensaje a stderr).
//
// comprobarEntorno(items, sondas) es async y devuelve los «texto» que faltan; SONDAS son las reales.
// Cada sonda recibe un item y devuelve Promise<boolean>, con tope de 10 s. Un item sin sonda cumple (largo:<s>).
// Solo lee la tarea y consulta el entorno: no escribe en disco.
//
// La CLI no corre al importar el módulo desde una prueba: solo si es el punto de entrada, o si el lanzador
// llama a ejecutarCli(argumentos) y usa el código que devuelve.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import dns from 'node:dns/promises';
import { homedir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerRequiere, parsearRequiere } from './formato-requiere.mjs';
import { secciones } from './formato-tarea.mjs';

const TOPE_MS = 10000;
const NAVEGADORES = ['google-chrome', 'chromium', 'chromium-browser', 'chrome'];

function versionDe(binario) {
  const r = spawnSync(binario, ['--version'], { encoding: 'utf8', timeout: TOPE_MS, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error || r.status !== 0) return null;
  const coincide = /(\d+(?:\.\d+)*)/.exec(`${r.stdout ?? ''}${r.stderr ?? ''}`);
  return coincide ? coincide[1] : null;
}

// «24» acepta «24.3.1»; «24.3» no acepta «24.4.0»; «24.3.1» no acepta «24.3».
function versionCumple(real, pedida) {
  const a = real.split('.');
  const b = pedida.split('.');
  return b.length <= a.length && b.every((segmento, i) => a[i] === segmento);
}

function puertoLibre(n) {
  return new Promise((resolver) => {
    const servidor = createServer();
    servidor.once('error', () => resolver(false));
    servidor.listen(n, '127.0.0.1', () => servidor.close(() => resolver(true)));
  });
}

function existe(ruta) {
  return existsSync(ruta);
}

function navegadorInstalado() {
  const dirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const nombre of NAVEGADORES) {
      if (existe(join(dir, nombre))) return true;
    }
  }
  if (existe('/Applications/Google Chrome.app')) return true;
  for (const base of [join(homedir(), 'Library', 'Caches', 'ms-playwright'), join(homedir(), '.cache', 'ms-playwright')]) {
    try {
      if (readdirSync(base).some((nombre) => nombre.startsWith('chromium-'))) return true;
    } catch {
      // el directorio no existe: no cuenta como instalado
    }
  }
  return false;
}

export const SONDAS = {
  docker: async () => spawnSync('docker', ['info'], { stdio: 'ignore', timeout: TOPE_MS }).status === 0,
  puerto: async (item) => puertoLibre(item.valor),
  red: async () => {
    try {
      await dns.lookup('example.com');
      return true;
    } catch {
      return false;
    }
  },
  runtime: async (item) => {
    const binario = item.nombre === 'node' ? process.execPath : item.nombre;
    const real = versionDe(binario);
    return real !== null && versionCumple(real, item.version);
  },
  navegador: async () => navegadorInstalado(),
};

async function conTope(promesa) {
  let temporizador;
  const tope = new Promise((resolver) => {
    temporizador = setTimeout(() => resolver(false), TOPE_MS);
  });
  try {
    return await Promise.race([promesa.then((v) => v === true, () => false), tope]);
  } finally {
    clearTimeout(temporizador);
  }
}

export async function comprobarEntorno(items, sondas = SONDAS) {
  const faltan = [];
  for (const item of items) {
    const sonda = sondas[item.tipo];
    if (!sonda) continue;
    const cumple = await conTope(Promise.resolve().then(() => sonda(item)));
    if (!cumple) faltan.push(item.texto);
  }
  return faltan;
}

// Propone los items de «Requiere:» a partir del cuerpo de «## Verificación». No sondea ni escribe nada.
export function sugerirRequiere(texto) {
  const seccion = secciones(texto.split('\n')).find((s) => s.titulo === 'Verificación');
  if (!seccion) return [];
  const cuerpo = seccion.lineas.join('\n');
  const sugerencias = [];
  if (/\bdocker\b/i.test(cuerpo)) sugerencias.push('docker');
  if (/\b(playwright|chromium|puppeteer)\b/i.test(cuerpo)) sugerencias.push('navegador');
  for (const m of cuerpo.matchAll(/\b(?:localhost|127\.0\.0\.1):(\d+)\b/g)) {
    const item = `puerto:${m[1]}`;
    if (!sugerencias.includes(item)) sugerencias.push(item);
  }
  return sugerencias;
}

export async function ejecutarCli(argumentos) {
  if (argumentos[0] === '--sugerir') {
    if (argumentos.length !== 2) {
      process.stderr.write('Uso: node scripts/entorno.mjs --sugerir <ruta-tarea>\n');
      return 2;
    }
    let texto;
    try {
      texto = readFileSync(argumentos[1], 'utf8');
    } catch (error) {
      process.stderr.write(`No se puede leer la tarea «${argumentos[1]}»: ${error.message}\n`);
      return 2;
    }
    const lista = sugerirRequiere(texto);
    process.stdout.write(`sugerido: Requiere: ${lista.length ? lista.join(', ') : 'ninguno'}\n`);
    return 0;
  }
  if (argumentos.length !== 1) {
    process.stderr.write('Uso: node scripts/entorno.mjs <ruta-tarea>\n');
    return 2;
  }
  let texto;
  try {
    texto = readFileSync(argumentos[0], 'utf8');
  } catch (error) {
    process.stderr.write(`No se puede leer la tarea «${argumentos[0]}»: ${error.message}\n`);
    return 2;
  }

  const requiere = extraerRequiere(texto);
  if (requiere.estado === 'ausente') {
    process.stdout.write('aviso: la tarea no declara Requiere\n');
    return 0;
  }
  if (requiere.estado === 'multiple') {
    process.stderr.write('«- Requiere:» aparece repetida en la sección Contexto.\n');
    return 2;
  }

  const analisis = parsearRequiere(requiere.valor);
  if (!analisis.ok) {
    process.stderr.write(`${analisis.error}\n`);
    return 2;
  }

  const faltan = await comprobarEntorno(analisis.items);
  if (faltan.length === 0) {
    process.stdout.write('ok\n');
    return 0;
  }
  process.stdout.write(`falta=${faltan.join(',')}\n`);
  return 1;
}

const esEntrada = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esEntrada) {
  process.exitCode = await ejecutarCli(process.argv.slice(2));
}
