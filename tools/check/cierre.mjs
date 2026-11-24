// Cierre mecánico de un plan (solo lectura): casillas pendientes, evidencia de los pasos `[x]`,
// criterios A# con corrida y coherencia del status con el resultado del builder.
// Puro: recibe textos y no lee ni escribe archivos. Reglas en changes/kit-scope-close/tramo-3.md.
// El conteo de casillas es el del contador canónico de core/skills/execute-plan/SKILL.md (awk '/^- \[ \]/').

import { crearInforme } from "./informe.mjs";

const RE_PENDIENTE = /^- \[ \]/;
const RE_HECHA = /^- \[x\]/i;
const RE_EVIDENCIA = /^## (Evidence|Evidencia)\s*$/;
const RE_NOTAS = /^## (Notes|Notas)\s*$/;
const RE_CRITERIO = /^- (A\d+):|^\|\s*(A\d+)\s*\|/;
// Línea de comando de evidencia: `$ cmd` o `etiqueta: $ cmd` (p. ej. `solo-lee: $ node ...`).
const RE_CMD = /^(?:[^$`]{1,60}:\s+)?\$ /;
const ESTADOS_EJECUCION = ["in progress", "done", "partial"];
const ESTADOS_INICIALES = ["draft", "approved"];
const RESULTADOS = ["DONE", "PAUSED"];

// Campos simples de la cabecera YAML (`clave: valor`).
export function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const campos = {};
  for (const linea of m[1].split("\n")) {
    const k = linea.match(/^([a-z_]+):\s*(.*)$/);
    if (k) campos[k[1]] = k[2].trim();
  }
  return campos;
}

// Líneas de las secciones `## ` cuyo encabezado cumple `re`; una sección termina en el siguiente `## `.
function seccion(lineas, re) {
  const out = [];
  let dentro = false;
  for (const l of lineas) {
    if (/^## /.test(l)) {
      dentro = re.test(l);
      continue;
    }
    if (dentro) out.push(l);
  }
  return out;
}

// Líneas que no pertenecen a ninguna de las secciones `res` (encabezados incluidos fuera).
function fueraDe(lineas, res) {
  const out = [];
  let dentro = false;
  for (const l of lineas) {
    if (/^## /.test(l)) dentro = res.some(re => re.test(l));
    if (!dentro) out.push(l);
  }
  return out;
}

// Bloques de evidencia: cada `$ <cmd>` abre un bloque que llega hasta el siguiente `$` o hasta una línea
// en blanco después de su `exit N`. `cabecera` es la última línea con texto antes del `$` (p. ej. «Paso 3 (A2):»).
function bloquesDeEvidencia(lineas) {
  const bloques = [];
  let cabecera = "";
  let actual = null;
  for (const l of lineas) {
    if (RE_CMD.test(l)) {
      actual = { cmd: l.replace(RE_CMD, "").trim(), texto: `${cabecera}\n${l}`, exit: null };
      bloques.push(actual);
      cabecera = "";
      continue;
    }
    if (actual) {
      if (l.trim() === "" && actual.exit !== null) {
        actual = null;
        continue;
      }
      const e = l.match(/^exit (\d+)/);
      if (e && actual.exit === null) actual.exit = Number(e[1]);
      actual.texto += `\n${l}`;
      continue;
    }
    if (l.trim()) cabecera = l;
  }
  return bloques;
}

// Pasos de checkbox raíz (`- [ ]` o `- [x]`) con su comando de `Check:` (primer span entre acentos graves tras «Check:»).
function pasosDe(lineas) {
  const pasos = [];
  lineas.forEach((linea, i) => {
    const pend = RE_PENDIENTE.test(linea);
    const hecha = RE_HECHA.test(linea);
    if (!pend && !hecha) return;
    let bloque = linea;
    for (let j = i + 1; j < lineas.length && /^\s{2,}\S/.test(lineas[j]); j++) bloque += ` ${lineas[j].trim()}`;
    const tras = bloque.split(/Check:/)[1];
    const m = tras?.match(/`([^`]+)`/);
    pasos.push({ texto: linea, hecha, pendiente: pend, comando: m ? m[1].trim().replace(/^\$\s*/, "") : null });
  });
  return pasos;
}

// A# que cubre un bloque de evidencia: los literales (`A3`) y los rangos (`A1–A5` o `A1-A5`, ambos extremos incluidos).
function idsCubiertos(texto) {
  const ids = new Set();
  for (const m of texto.matchAll(/\bA(\d+)\b/g)) ids.add(`A${m[1]}`);
  for (const m of texto.matchAll(/\bA(\d+)\s*[–-]\s*A(\d+)\b/g)) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a <= b && b - a <= 50) for (let i = a; i <= b; i++) ids.add(`A${i}`);
  }
  return ids;
}

// Tramos: con `segment:` se usan los N ≤ segment; sin `segment:`, todos.
function fuentesDe(textoPlan, tramos, segmento) {
  const fuentes = [{ nombre: "plan.md", lineas: textoPlan.split("\n") }];
  for (const t of tramos) {
    if (segmento === undefined || t.n <= segmento) fuentes.push({ nombre: `tramo-${t.n}.md`, lineas: t.texto.split("\n") });
  }
  return fuentes;
}

// Revisa el cierre de un plan. `tramos` es [{ n, texto }]; `resultado` es "DONE", "PAUSED" o nada.
// Devuelve el informe común (tools/check/informe.mjs). Lanza si `resultado` no es válido.
export function revisarCierre(textoPlan, tramos = [], { resultado } = {}) {
  if (resultado !== undefined && !RESULTADOS.includes(resultado)) throw new Error(`resultado no válido: ${resultado}`);
  const fm = frontmatter(textoPlan);
  // Plan con formato v1 (sin `status:`): no hay contrato de estado que comparar; no verificable global.
  if (fm.status === undefined) {
    return crearInforme([{ nivel: "no_verificable", elemento: "status", mensaje: "plan sin `status:` (formato v1): cierre no verificable" }]);
  }
  const segmento = /^\d+$/.test(fm.segment ?? "") ? Number(fm.segment) : undefined;
  const fuentes = fuentesDe(textoPlan, tramos, segmento);
  const filas = [];

  const pendientes = fuentes.reduce((n, f) => n + f.lineas.filter(l => RE_PENDIENTE.test(l)).length, 0);
  const pasos = fuentes.flatMap(f => pasosDe(f.lineas));
  const hechas = pasos.filter(p => p.hecha);
  if (pendientes + hechas.length === 0) {
    filas.push({ nivel: "no_verificable", elemento: "casillas", mensaje: "sin casillas `- [ ]` ni `- [x]` en Steps" });
    return crearInforme(filas);
  }

  if (pendientes > 0) {
    filas.push({ nivel: "error", elemento: "casillas", mensaje: `${pendientes} casillas pendientes (contador canónico)` });
  }

  const hayEvidencia = fuentes.some(f => f.lineas.some(l => RE_EVIDENCIA.test(l)));
  if (!hayEvidencia) {
    filas.push({ nivel: "no_verificable", elemento: "evidencia", mensaje: "plan sin sección Evidence parseable" });
  } else {
    const bloques = bloquesDeEvidencia(fuentes.flatMap(f => seccion(f.lineas, RE_EVIDENCIA)));

    for (const p of hechas) {
      const etiqueta = `paso: ${p.texto.replace(/^- \[[xX]\]\s*/, "").slice(0, 50)}`;
      if (!p.comando) {
        filas.push({ nivel: "no_verificable", elemento: etiqueta, mensaje: "sin comando entre acentos graves en Check:" });
        continue;
      }
      const coincidencias = bloques.filter(b => b.cmd.includes(p.comando));
      if (coincidencias.length === 0) {
        filas.push({ nivel: "error", elemento: etiqueta, mensaje: `paso marcado sin evidencia: \`${p.comando}\`` });
        continue;
      }
      // Se usa la última corrida que tenga `exit N`; una corrida posterior sin exit (p. ej. `cmd; echo "x exit $?"`) no la oculta.
      const ultima = coincidencias.findLast(b => b.exit !== null) ?? coincidencias.at(-1);
      if (ultima.exit === null) {
        filas.push({ nivel: "error", elemento: etiqueta, mensaje: `paso sin exit N tras \`$ ${p.comando}\`` });
      } else if (ultima.exit === 0) {
        filas.push({ nivel: "ok", elemento: etiqueta, mensaje: "evidencia con exit 0" });
      } else {
        filas.push({ nivel: "aviso", elemento: etiqueta, mensaje: `exit ${ultima.exit} (verifica que el paso lo esperaba)` });
      }
    }

    const criterios = [...new Set(
      fuentes
        .flatMap(f => fueraDe(f.lineas, [RE_EVIDENCIA, RE_NOTAS]))
        .map(l => l.match(RE_CRITERIO))
        .filter(Boolean)
        .map(m => m[1] ?? m[2]),
    )];
    for (const id of criterios) {
      const cubierto = bloques.some(b => b.exit !== null && idsCubiertos(b.texto).has(id));
      if (!cubierto) filas.push({ nivel: "error", elemento: id, mensaje: `${id} sin corrida en Evidence` });
    }
  }

  const status = fm.status ?? "";
  const reconocido = [...ESTADOS_EJECUCION, ...ESTADOS_INICIALES].includes(status);
  if (!reconocido) {
    filas.push({ nivel: "error", elemento: "status", mensaje: `status no reconocido: ${status || "(vacío)"}` });
  } else if (ESTADOS_INICIALES.includes(status) && hechas.length > 0) {
    filas.push({ nivel: "error", elemento: "status", mensaje: `status: ${status} con ${hechas.length} casillas marcadas` });
  }

  if (resultado === undefined) {
    if (reconocido) filas.push({ nivel: "no_verificable", elemento: "status", mensaje: "sin resultado del builder: coherencia no verificable" });
  } else if (resultado === "DONE") {
    if (status === "done") filas.push({ nivel: "ok", elemento: "status", mensaje: "status: done coherente con DONE" });
    else filas.push({ nivel: "error", elemento: "status", mensaje: `status: ${status || "(vacío)"}; el builder devolvió DONE (se espera done)` });
  } else {
    if (status !== "partial") filas.push({ nivel: "error", elemento: "status", mensaje: `status: ${status || "(vacío)"}; el builder devolvió PAUSED (se espera partial)` });
    const notas = seccion(fuentes[0].lineas, RE_NOTAS).filter(l => l.trim());
    if (notas.length === 0) filas.push({ nivel: "error", elemento: "Notes", mensaje: "PAUSED sin nota de reanudación en Notes" });
    else filas.push({ nivel: "ok", elemento: "Notes", mensaje: "PAUSED con nota de reanudación" });
  }

  return crearInforme(filas);
}
