import { readFileSync, writeFileSync } from "node:fs";

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  const datos = {};
  if (!m) return datos;
  for (const linea of m[1].split("\n")) {
    const k = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (k) datos[k[1]] = k[2].trim();
  }
  return datos;
}

function fijarEstado(planPath, estado) {
  const texto = readFileSync(planPath, "utf8");
  writeFileSync(planPath, texto.replace(/^estado: .*$/m, `estado: ${estado}`));
}

function anotarNotas(planPath, linea) {
  const texto = readFileSync(planPath, "utf8");
  writeFileSync(planPath, `${texto.trimEnd()}\n- kit run: ${linea}\n`);
}

// Cuenta casillas raíz: [x] y pendientes [ ].
function progreso(planPath) {
  const lineas = readFileSync(planPath, "utf8").split("\n");
  const hechos = lineas.filter(l => /^- \[x\]/.test(l)).length;
  const pend = lineas.filter(l => /^- \[ \]/.test(l)).length;
  return { hechos, total: hechos + pend };
}

// Primer código de la sección ## Verificación (p. ej. `./verify`); sin él, ./verify.
function comandoVerificacion(texto) {
  const m = texto.match(/^## Verificación\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
  const cod = m && m[1].match(/`([^`]+)`/);
  return cod ? cod[1] : "./verify";
}

export { anotarNotas, comandoVerificacion, fijarEstado, frontmatter, progreso };
