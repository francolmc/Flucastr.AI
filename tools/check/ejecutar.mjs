// Ejecuta una fila de criterio A# sin shell, bajo la política del hook de permisos (segmento 2).
// Estados fijos: pasa | falla | no-automatizable | bloqueado.
import { spawnSyncSeguro } from "../spawn/sync-seguro.mjs";
import { accionProtegida, META } from "../../scripts/permissions-hook.mjs";
import { redactar, truncar } from "../progress/eventos.mjs";

const TIMEOUT_POR_OMISION = 60_000;
const LINEAS_COLA = 20;
const LIMITE_SALIDA = 2000;

// Solo se automatizan estas formas del texto «esperado». Lo demás no se ejecuta.
function esperadoAutomatizable(texto) {
  const t = String(texto ?? "").trim();
  let m = /^(?:exit|rc|código)\s+(\d+)$/i.exec(t);
  if (m) return { tipo: "codigo", valor: Number(m[1]) };
  if (/^(?:falla|rc\s*≠\s*0)$/i.test(t)) return { tipo: "fallo" };
  m = /^contiene\s+«([^»]+)»$/i.exec(t);
  if (m) return { tipo: "contiene", valor: m[1] };
  return null;
}

// Separa en tokens sin shell. Devuelve null si hay un metacarácter fuera de comillas o una comilla sin cerrar.
function tokenizar(comando) {
  const tokens = [];
  let actual = null;
  let comilla = null;
  for (const ch of comando) {
    if (comilla) {
      if (ch === comilla) comilla = null;
      else actual += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      comilla = ch;
      actual ??= "";
      continue;
    }
    if (META.test(ch)) return null;
    if (/\s/.test(ch)) {
      if (actual !== null) tokens.push(actual);
      actual = null;
      continue;
    }
    actual = (actual ?? "") + ch;
  }
  if (comilla) return null;
  if (actual !== null) tokens.push(actual);
  return tokens;
}

// Cola de la salida: últimas líneas, redactadas y truncadas.
function cola(texto) {
  const lineas = texto.replace(/\n+$/, "").split("\n");
  return truncar(redactar(lineas.slice(-LINEAS_COLA).join("\n")), LIMITE_SALIDA);
}

export function ejecutarFila(fila, { timeoutMs = TIMEOUT_POR_OMISION } = {}) {
  const comando = fila.comando ?? null;
  const base = { comando, codigo: null, salida: "" };

  if (!comando) return { ...base, estado: "no-automatizable", motivo: "sin comando" };

  const esperado = esperadoAutomatizable(fila.esperado);
  if (!esperado) {
    return { ...base, estado: "no-automatizable", motivo: `esperado no automatizable: «${fila.esperado}»` };
  }

  const tokens = tokenizar(comando);
  if (!tokens || accionProtegida(comando)) {
    return { ...base, estado: "bloqueado", motivo: "acción protegida o metacarácter de shell fuera de comillas" };
  }
  if (tokens.length === 0) return { ...base, estado: "no-automatizable", motivo: "sin comando" };

  const r = spawnSyncSeguro(tokens[0], tokens.slice(1), {
    cwd: fila.cwd ?? process.cwd(),
    shell: false,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  const bruto = [r.stdout, r.stderr].filter(Boolean).join("\n");
  const salida = cola(bruto);

  if (r.error) {
    const motivo = r.error.code === "ETIMEDOUT"
      ? `tiempo agotado tras ${timeoutMs} ms`
      : `no se pudo ejecutar: ${r.error.code}`;
    return { comando, estado: "falla", codigo: r.status, salida, motivo };
  }

  const codigo = r.status;
  let ok;
  let motivo = null;
  if (esperado.tipo === "codigo") {
    ok = codigo === esperado.valor;
    if (!ok) motivo = `código ${codigo}, se esperaba ${esperado.valor}`;
  } else if (esperado.tipo === "fallo") {
    ok = codigo !== 0;
    if (!ok) motivo = "se esperaba fallo y salió 0";
  } else {
    ok = bruto.includes(esperado.valor);
    if (!ok) motivo = `la salida no contiene «${esperado.valor}»`;
  }
  return { comando, estado: ok ? "pasa" : "falla", codigo, salida, motivo };
}
