// Oráculo de la tabla aprobada (lo escribe el planner; el builder no lo edita).
// Uso: node changes/done/hook-parser/comparar.mjs          → evaluar() de scripts/hook-decidir.mjs
//      node changes/done/hook-parser/comparar.mjs --hook   → el hook real (proceso), sin ejecutar los comandos
import { fileURLToPath } from "node:url";
import { CASOS, propuesta } from "./casos.mjs";
import { accionProtegida } from "../../../scripts/permissions-hook.mjs";
import { spawnSyncSeguro } from "../../../tools/spawn/sync-seguro.mjs";

const RAIZ = fileURLToPath(new URL("../../..", import.meta.url));
const HOOK = fileURLToPath(new URL("../../../scripts/permissions-hook.mjs", import.meta.url));
const ALIVIADOS = "P1 P2 P3 P4 P5 P6 P7 P8 P9";

let decidir;
if (process.argv.includes("--hook")) {
  decidir = (command) => {
    const r = spawnSyncSeguro(process.execPath, [HOOK, "decision", "--project", RAIZ], {
      cwd: RAIZ, input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }), encoding: "utf8", timeout: 10000,
    });
    if (r.status !== 0) return `error ${r.status}`;
    return r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : "normal";
  };
} else {
  const { evaluar } = await import("../../../scripts/hook-decidir.mjs");
  const { esSecreto } = await import("../../../scripts/permissions-hook.mjs");
  decidir = (c) => evaluar(c, { textual: accionProtegida, secreto: esSecreto });
}

let bien = 0;
const aliviados = [];
for (const [id, comando] of CASOS) {
  const obtenido = decidir(comando);
  if (obtenido === propuesta(id)) bien++;
  else console.log(`${id}: esperado ${propuesta(id)}, obtenido ${obtenido}`);
  if (accionProtegida(comando) && obtenido !== "deny") aliviados.push(id);
}
console.log(`tabla: ${bien}/${CASOS.length}`);
console.log(`dejan de bloquearse: ${aliviados.join(" ")}`);
if (bien !== CASOS.length || aliviados.join(" ") !== ALIVIADOS) process.exitCode = 1;
