// Lanzamiento síncrono sin stdin pipe. Con stdin como pipe, spawnSync/execFileSync devuelven
// EPERM en el sandbox workspace-write de Codex aunque el hijo sale con status 0 (ver
// changes/fix-verify-sandbox-eperm/exploracion.md). Reglas:
//   A1: sin `stdio` ni `input`, el hijo recibe stdin cerrado: ["ignore", "pipe", "pipe"].
//   A2: con `input`, el texto va a un archivo temporal que se pasa como fd de stdin y se borra al terminar.
//   A3: con `stdio` explícito, el helper no cambia nada.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, openSync, closeSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Devuelve las opciones listas para el hijo y una función que libera el fd y el directorio temporal.
export function prepararStdio(opciones = {}) {
  const { stdio, input, ...resto } = opciones;
  if (stdio !== undefined) {
    return { opciones, limpiar: () => {} };
  }
  if (input === undefined) {
    return { opciones: { ...resto, stdio: ["ignore", "pipe", "pipe"] }, limpiar: () => {} };
  }
  const dir = mkdtempSync(join(tmpdir(), "spawn-seguro-"));
  const archivo = join(dir, "stdin");
  writeFileSync(archivo, input);
  const fd = openSync(archivo, "r");
  return {
    opciones: { ...resto, stdio: [fd, "pipe", "pipe"] },
    limpiar: () => {
      try {
        closeSync(fd);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}

export function spawnSyncSeguro(comando, args = [], opciones = {}) {
  const { opciones: listas, limpiar } = prepararStdio(opciones);
  try {
    return spawnSync(comando, args, listas);
  } finally {
    limpiar();
  }
}

export function execFileSyncSeguro(archivo, args = [], opciones = {}) {
  const { opciones: listas, limpiar } = prepararStdio(opciones);
  try {
    return execFileSync(archivo, args, listas);
  } finally {
    limpiar();
  }
}
