#!/usr/bin/env node
// Comprueba que cada agente instalado (Claude Code y Pi) lleva el modelo que modelos.json le asigna
// y que el lanzador de Pi resuelve ese modelo al arrancar. No usa modelo ni red.
//
// Uso: node pruebas/comprobaciones/modelos-agentes.mjs

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REINSTALAR = 'reinstala con bash instalar.sh';

function modeloEsperado(raiz, agente, herramienta) {
  const r = spawnSync(process.execPath, [join(raiz, 'scripts', 'resolver.mjs'), 'modelo', agente, herramienta], { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    return { error: (r.error?.message || r.stderr || 'fallo desconocido').trim() };
  }
  return { modelo: r.stdout.trim() };
}

// Devuelve las líneas `model:` del encabezado (entre las dos líneas `---`).
function lineasModelo(texto) {
  const lineas = texto.split(/\r?\n/);
  if (lineas[0] !== '---') return [];
  const fin = lineas.indexOf('---', 1);
  const cabecera = lineas.slice(1, fin === -1 ? undefined : fin);
  return cabecera.filter(l => /^model:/.test(l)).map(l => l.slice('model:'.length).trim());
}

export function comprobarModelos({ raiz = RAIZ_REPO, claudeDir, piDir, binDir } = {}) {
  const errores = [];

  const agentes = readdirSync(join(raiz, 'agentes'))
    .filter(n => n.endsWith('.md'))
    .map(n => basename(n, '.md'))
    .sort();

  const herramientas = [];
  if (claudeDir && existsSync(claudeDir)) {
    herramientas.push({ nombre: 'claude-code', dir: join(claudeDir, 'agents') });
  }
  if (piDir && existsSync(piDir)) {
    herramientas.push({ nombre: 'pi', dir: join(piDir, 'agents') });
  }

  for (const agente of agentes) {
    for (const h of herramientas) {
      const etiqueta = `${h.nombre}/${agente}`;
      const ruta = join(h.dir, `${agente}.md`);

      const esperado = modeloEsperado(raiz, agente, h.nombre);
      if (esperado.error) {
        errores.push(`${etiqueta}: no pude resolver el modelo en modelos.json (${esperado.error})`);
        continue;
      }

      if (!existsSync(ruta)) {
        errores.push(`${etiqueta}: falta el agente instalado «${ruta}»; ${REINSTALAR}`);
      } else {
        const lineas = lineasModelo(readFileSync(ruta, 'utf8'));
        if (lineas.length !== 1) {
          errores.push(`${etiqueta}: el encabezado de «${ruta}» tiene ${lineas.length} líneas «model:» (debe tener 1); ${REINSTALAR}`);
        } else if (lineas[0] !== esperado.modelo) {
          errores.push(`${etiqueta}: instalado «${lineas[0]}», modelos.json pide «${esperado.modelo}»; ${REINSTALAR}`);
        }
      }

      if (h.nombre === 'pi' && binDir) {
        const lanzador = join(binDir, `pi-${agente}`);
        if (!existsSync(lanzador)) {
          errores.push(`${etiqueta}: falta el lanzador «${lanzador}»; ${REINSTALAR}`);
        } else if (!readFileSync(lanzador, 'utf8').includes(`resolver.mjs" modelo ${agente} pi`)) {
          errores.push(`${etiqueta}: el lanzador «${lanzador}» no resuelve el modelo desde modelos.json; ${REINSTALAR}`);
        }
      }
    }
  }

  return errores;
}

const esScript = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (esScript) {
  const casa = homedir();
  const errores = comprobarModelos({
    raiz: RAIZ_REPO,
    claudeDir: process.env.CLAUDE_CONFIG_DIR || join(casa, '.claude'),
    piDir: process.env.PI_CODING_AGENT_DIR || join(casa, '.pi', 'agent'),
    binDir: join(casa, '.local', 'bin'),
  });
  if (errores.length > 0) {
    for (const e of errores) console.log(e);
    process.exit(1);
  }
  console.log('modelos de agentes instalados vigentes');
}
