// Decisión del hook de permisos sobre una línea de Bash: `deny`, `ask` o `normal`.
// Sin efectos: solo analiza (ver hook-shell.mjs). No importa permissions-hook.mjs:
// la regla textual y el detector de secretos llegan por parámetro.
// Prioridad: deny > ask > normal. Un fallo interno nunca da `normal`.
import { analizar } from "./hook-shell.mjs";

const MAX_PROFUNDIDAD = 10;
const RANGO = { normal: 0, ask: 1, deny: 2 };
const PEOR = (a, b) => (RANGO[a] >= RANGO[b] ? a : b);
const INERTES = new Set(["cat", "echo", "printf", "grep", "rg", "mkdir", "ls", "wc", "head", "tail", "true"]);
const OPCIONES_GREP = /^-[ncilEFwoqhHxvs]+$/;
const OPCIONES_RG = /^-[ncilFwoqx]+$/;
const GIT_CON_VALOR = new Set(["-C", "-c", "--git-dir", "--work-tree"]);
const INTERPRETES = new Set(["bash", "sh", "zsh"]);
const DEPLOY = new Set(["deploy", "deployment"]);

export function evaluar(comando, { textual, secreto }) {
  return evaluarCon(comando, { textual, secreto, prof: 0 });
}

function evaluarCon(comando, ctx) {
  let esTextual;
  try {
    esTextual = Boolean(ctx.textual(comando));
  } catch {
    // Sin saber si la línea es textual, no se puede dejar pasar.
    return "deny";
  }
  try {
    if (ctx.prof > MAX_PROFUNDIDAD) throw new Error("profundidad excesiva");
    const r = analizar(comando);
    if (!r.ok) return esTextual ? "deny" : "ask";
    const paso2 = evaluarNodos(r.comandos, ctx);
    if (!esTextual) return paso2;
    return lineaInerte(r) && paso2 === "normal" ? "normal" : "deny";
  } catch {
    return esTextual ? "deny" : "ask";
  }
}

function evaluarNodos(nodos, ctx) {
  let res = "normal";
  for (const n of nodos) {
    res = PEOR(res, evaluarNodo(n, ctx));
    if (res === "deny") return res;
  }
  return res;
}

function evaluarNodo(n, ctx) {
  const { secreto } = ctx;
  for (const red of n.redirecciones) if (secreto(red.destino.texto)) return "deny";
  for (const asig of n.asignaciones) if (secreto(valorDe(asig.texto))) return "deny";
  const palabras = n.palabras;
  if (palabras.length === 0) return "normal";
  const primera = palabras[0];
  if (INERTES.has(primera.texto)) return evaluarInerte(n, secreto);
  if (primera.baseDinamica) return "ask";
  for (const w of palabras) {
    if (secreto(w.texto) || DEPLOY.has(w.texto.toLowerCase())) return "deny";
  }
  // git, gh, intérpretes y eval se miran en cualquier posición (env, sudo, timeout, find -exec...).
  let res = "normal";
  let interprete = false;
  for (let i = 0; i < palabras.length; i++) {
    const b = base(palabras[i].texto);
    if (b === "git") res = PEOR(res, reglaGit(palabras, i));
    if (b === "gh") res = PEOR(res, reglaGh(palabras, i));
    if (INTERPRETES.has(b)) {
      interprete = true;
      res = PEOR(res, reglaInterprete(palabras, i, ctx));
    }
    if (b === "eval") res = PEOR(res, reglaEval(palabras, i, ctx));
  }
  if (interprete) {
    for (const hd of n.heredocs) {
      const cuerpoDinamico = !hd.citado && /[$`\\]/.test(hd.cuerpo);
      res = PEOR(res, cuerpoDinamico ? "ask" : evaluarCon(hd.cuerpo, hijo(ctx)));
    }
    for (const red of n.redirecciones) {
      if (red.op !== "<<<") continue;
      res = PEOR(res, red.destino.expansion ? "ask" : evaluarCon(red.destino.texto, hijo(ctx)));
    }
  }
  return res;
}

// Nombres inertes: solo se revisan sus palabras como datos según su forma.
function evaluarInerte(n, secreto) {
  const palabras = n.palabras;
  const nombre = palabras[0].texto;
  const args = palabras.slice(1);
  let revisar = args;
  if (nombre === "echo" || nombre === "printf") revisar = [];
  else if (nombre === "grep" || nombre === "rg") {
    const sep = separar(args, nombre === "grep" ? OPCIONES_GREP : OPCIONES_RG);
    if (sep.ok) {
      // El patrón no se revisa como dato; si es secreto, solo puede buscar en archivos de texto.
      const [patron, ...rutas] = sep.operandos;
      revisar = rutas;
      if (patron && secreto(patron.texto) && !rutasDeTexto(rutas)) return "deny";
    }
  }
  for (const w of revisar) if (secreto(w.texto)) return "deny";
  return "normal";
}

function reglaGit(palabras, gi) {
  for (let j = gi + 1; j < palabras.length; j++) {
    const raw = palabras[j].texto;
    const t = raw.toLowerCase();
    if (["commit", "push", "merge"].includes(t)) return "deny";
    if (raw.startsWith("-c") && t.slice(2).startsWith("alias.")) return "deny";
    if (t.startsWith("--config-env=alias.")) return "deny";
    if ((raw === "-c" || t === "--config-env") && (palabras[j + 1]?.texto.toLowerCase() ?? "").startsWith("alias.")) return "deny";
  }
  let j = gi + 1;
  while (j < palabras.length) {
    const raw = palabras[j].texto;
    if (GIT_CON_VALOR.has(raw)) j += 2;
    else if (raw.startsWith("-")) j++;
    else break;
  }
  return j < palabras.length && palabras[j].expansion ? "ask" : "normal";
}

// `gh` en la posición k: sus argumentos son las palabras siguientes.
function reglaGh(palabras, k) {
  const resto = palabras.slice(k + 1);
  for (let i = 0; i < resto.length; i++) {
    if (resto[i].texto.toLowerCase() !== "pr") continue;
    for (let m = i + 1; m < resto.length; m++) {
      if (["create", "merge"].includes(resto[m].texto.toLowerCase())) return "deny";
    }
  }
  const primeros = resto.filter((w) => !w.texto.startsWith("-")).slice(0, 2);
  return primeros.some((w) => w.expansion) ? "ask" : "normal";
}

// Intérprete en la posición k: lee sus opciones (una corta con o/O lleva valor) y, con -c, evalúa el script.
function reglaInterprete(palabras, k, ctx) {
  let res = "normal";
  let j = k + 1;
  let conC = false;
  while (j < palabras.length && /^[-+]/.test(palabras[j].texto)) {
    const t = palabras[j].texto;
    const corta = /^[-+][^-]/.test(t);
    if (corta && t[0] === "-" && t.includes("c")) conC = true;
    j++;
    const siguiente = palabras[j]?.texto ?? "-";
    if (corta && /[oO]/.test(t) && !siguiente.startsWith("-")) j++;
  }
  if (conC) {
    const script = palabras[j];
    res = !script || script.expansion ? "ask" : evaluarCon(script.texto, hijo(ctx));
  }
  return res;
}

function reglaEval(palabras, k, ctx) {
  const args = palabras.slice(k + 1);
  if (args.some((w) => w.expansion)) return "ask";
  if (args.length === 0) return "normal";
  return evaluarCon(args.map((w) => w.texto).join(" "), hijo(ctx));
}

// Línea inerte: única condición para levantar una regla textual.
function lineaInerte(r) {
  if (!r.plano) return false;
  for (const n of r.comandos) {
    if (n.palabras.length === 0 || n.asignaciones.length) return false;
    const palabras = n.palabras;
    const nombre = palabras[0].texto;
    if (!INERTES.has(nombre)) return false;
    if (palabras.some((w) => w.expansion || w.glob)) return false;
    if (n.redirecciones.some((red) => red.destino.expansion || red.destino.glob || !redireccionInerte(red))) return false;
    if (n.heredocs.some((hd) => !hd.citado && /[$`\\]/.test(hd.cuerpo))) return false;
    const args = palabras.slice(1);
    if (nombre === "printf" && args[0]?.texto.startsWith("-")) return false;
    if (nombre === "mkdir" && args.some((w) => w.texto.startsWith("-") && w.texto !== "-p")) return false;
    if (nombre === "grep" || nombre === "rg") {
      const sep = separar(args, nombre === "grep" ? OPCIONES_GREP : OPCIONES_RG);
      if (!sep.ok) return false;
      const rutas = sep.operandos.slice(1);
      if (nombre === "rg" && rutas.length === 0) return false;
      if (rutas.some((w) => rutaDudosa(w.texto))) return false;
    }
  }
  return true;
}

function redireccionInerte({ op, destino }) {
  if (op === "<" || op === "<<<") return true;
  if (op === ">&" || op === "<&") return /^\d+$/.test(destino.texto);
  if (op === ">" || op === ">>") return destino.texto === "/dev/null" || rutaEscribible(destino.texto);
  return false;
}

// Ruta relativa o absoluta que termina en .md, .txt o .log, sin `..` ni segmentos que empiecen por `.`.
function rutaEscribible(ruta) {
  if (ruta.startsWith("~")) return false;
  const relativa = ruta.startsWith("./") ? ruta.slice(2) : ruta;
  if (!/\.(md|txt|log)$/.test(relativa)) return false;
  return relativa.split("/").every((s) => s !== ".." && !s.startsWith("."));
}

// Ruta de grep o rg que no es inerte: absoluta, de usuario o con segmento oculto (grep también lee carpetas y ocultos).
function rutaDudosa(ruta) {
  return /^[/~]/.test(ruta) || ruta.split("/").some((s) => s.startsWith("."));
}

// Con patrón secreto, las rutas deben existir y terminar en .md, .txt o .log, sin ser ocultas ni absolutas.
function rutasDeTexto(rutas) {
  return rutas.length > 0 && rutas.every((w) => /\.(md|txt|log)$/.test(w.texto) && !rutaDudosa(w.texto));
}

// Separa opciones (que deben cumplir `reOpc`, o ser `--`) de operandos.
function separar(args, reOpc) {
  const operandos = [];
  let ok = true;
  let fin = false;
  for (const w of args) {
    const t = w.texto;
    if (!fin && t === "--") {
      fin = true;
      continue;
    }
    if (!fin && t.length > 1 && t.startsWith("-")) {
      if (!reOpc.test(t)) ok = false;
      continue;
    }
    operandos.push(w);
  }
  return { ok, operandos };
}

function valorDe(asignacion) {
  return asignacion.slice(asignacion.indexOf("=") + 1);
}

function base(texto) {
  return texto.toLowerCase().split("/").pop();
}

function hijo(ctx) {
  return { ...ctx, prof: ctx.prof + 1 };
}
