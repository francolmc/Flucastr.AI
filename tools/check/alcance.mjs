// Interpreta la sección Scope (o Alcance) de un plan en prosa libre y clasifica rutas contra ella.
// Puro: recibe texto, no lee archivos. Si el texto no permite decidir, devuelve `no_verificable`;
// nunca «ok» por defecto.
//
// Reglas (contrato en changes/kit-scope-close/tramo-1.md):
// - Sección `## Scope` o `## Alcance` hasta el siguiente `## `. Sin ella o sin rutas: no_verificable.
// - Rutas: tokens entre acentos graves con `/` o extensión conocida y sin espacios. Raíz sin extensión: `./x` en una lista explícita o exclusión.
// - Anotaciones entre paréntesis se ignoran; `(solo …)` o `(líneas …)` cuentan la ruta completa y dejan aviso «parcial».
// - Formas: `dir/` = prefijo; `dir/**` o `*.ext` = glob; resto = archivo exacto.
// - Exclusión: desde la palabra clave (`Fuera`, `No tocar`, `No modificar`, `Out of scope`, `Excluded`) hasta fin de línea.
// - Gana la regla más específica (patrón más largo); en empate, la exclusión.
// - Rutas con `..`, absolutas, o con `{}` / `!`: no_verificable con motivo.
// - Tramos (opcional): líneas `Scope:` o `Files:` de los tramo-N.md con N ≤ segmento se suman a las del índice.

const EXTENSIONES = /\.(mjs|cjs|js|ts|sh|md|json|ya?ml|lock|lockb|txt|test\.mjs|test\.js)$/;
const RE_SECCION = /^## (Scope|Alcance)\s*$/;
const RE_EXCLUSION = /(Fuera\b|Out of scope|Excluded\b|No tocar|No modificar)/;
const RE_TRAMO_LINEA = /^(Scope|Files):\s*(.*)$/;

// Devuelve las líneas de la primera sección Scope/Alcance, o null.
function seccion(texto) {
  const lineas = texto.split("\n");
  const inicio = lineas.findIndex(l => RE_SECCION.test(l.trim()));
  if (inicio < 0) return null;
  const cuerpo = [];
  for (let i = inicio + 1; i < lineas.length; i++) {
    if (/^## /.test(lineas[i])) break;
    cuerpo.push(lineas[i]);
  }
  return cuerpo;
}

// Normaliza un candidato a ruta. Devuelve { ruta } | { ignorar: true } | { error: motivo }.
function candidato(bruto, raizExplicita = false) {
  const t = bruto.trim();
  if (!t || /\s/.test(t)) return { ignorar: true };
  const ruta = t.replace(/^\.\//, "");
  if (ruta.startsWith("/")) return { error: `ruta absoluta: ${t}` };
  if (ruta.includes("..")) return { error: `ruta con «..»: ${t}` };
  if (/[{}!]/.test(ruta)) return { error: `patrón con llaves o «!» no soportado: ${t}` };
  if ((raizExplicita && t.startsWith("./")) || ruta.includes("/") || EXTENSIONES.test(ruta)) return { ruta };
  return { ignorar: true };
}

// Tokens entre acentos graves de un fragmento de línea, con su anotación posterior.
function tokensGraves(fragmento, exclusion = false) {
  return [...fragmento.matchAll(/`([^`]+)`/g)].map(m => {
    const prefijo = fragmento.slice(0, m.index);
    const raizExplicita = exclusion || /^\s*(?:[-*]\s*)?(?:`[^`]+`\s*,\s*)*$/.test(prefijo);
    const resto = fragmento.slice(m.index + m[0].length);
    return { texto: m[1], raizExplicita, parcial: /^\s*\((solo|líneas)/i.test(resto) };
  });
}

// Tokens de una línea de tramo `Scope:`/`Files:`: con acentos graves, esos; si no, separados por comas.
function tokensTramo(valor) {
  const sinAnotaciones = valor.replace(/\([^)]*\)/g, "");
  if (valor.includes("`")) return tokensGraves(sinAnotaciones).map(t => t.texto);
  return sinAnotaciones.split(/[,;]/);
}

// Un patrón coincide con una ruta: prefijo (`dir/`), glob (`*`, `**`) o exacto.
export function coincide(patron, ruta) {
  if (patron.endsWith("/")) return ruta.startsWith(patron);
  if (patron.includes("*")) {
    const escapar = s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const re = patron.split("**").map(p => p.split("*").map(escapar).join("[^/]*")).join(".*");
    return new RegExp(`^${re}$`).test(ruta);
  }
  return ruta === patron;
}

// Patrón más específico que coincide (por longitud). Devuelve su longitud o -1.
function especificidad(reglas, ruta) {
  let mejor = -1;
  for (const r of reglas) if (coincide(r.ruta, ruta)) mejor = Math.max(mejor, r.ruta.length);
  return mejor;
}

// Prohibidas fijas (tramo-1, punto 6): secretos siempre; lockfiles salvo que el Scope los nombre exacto.
const SECRETOS = [/^\.env(\.(?!example$).+)?$/, /\.(pem|key|p12|pfx)$/, /^id_(rsa|ed25519|ecdsa)/];
const LOCKFILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "Cargo.lock", "poetry.lock"]);

export function esProhibida(ruta, alcance) {
  const nombre = ruta.split("/").pop();
  if (SECRETOS.some(re => re.test(nombre))) return true;
  if (!LOCKFILES.has(nombre)) return false;
  return !alcance.incluidas.some(i => i.ruta === ruta);
}

// Clasifica una ruta: prohibida | dentro | fuera | excluida.
export function clasificarRuta(ruta, alcance) {
  if (esProhibida(ruta, alcance)) return "prohibida";
  const inc = especificidad(alcance.incluidas, ruta);
  const exc = especificidad(alcance.excluidas, ruta);
  if (inc < 0 && exc < 0) return "fuera";
  return exc >= inc ? "excluida" : "dentro";
}

// Texto que el builder no puede cambiar: el cuerpo de Scope y las líneas de criterios A#.
// Se compara contra la versión de la base para detectar cambios prohibidos en el plan.
export function protegido(texto) {
  const cuerpo = seccion(texto) ?? [];
  const criterios = texto.split("\n").filter(l => /^\s*(\|\s*)?-?\s*A\d+\b/.test(l));
  return [...cuerpo, "--", ...criterios].map(l => l.trim()).filter(Boolean).join("\n");
}

function sinVerificar(motivo) {
  return { estado: "no_verificable", motivo, incluidas: [], excluidas: [], avisos: [] };
}

export function parsearAlcance(texto, { segmento, tramos = [] } = {}) {
  const cuerpo = seccion(texto);
  if (cuerpo === null) return sinVerificar("sin Scope");

  const incluidas = [];
  const excluidas = [];
  const avisos = [];
  let error = null;

  const registrar = (token, lista, origen) => {
    const c = candidato(token.texto, token.raizExplicita);
    if (c.error) {
      error ??= c.error;
      return;
    }
    if (c.ignorar) return;
    lista.push({ ruta: c.ruta, origen });
    if (token.parcial) avisos.push({ ruta: c.ruta, mensaje: "anotación «parcial»: se cuenta la ruta completa" });
  };

  for (const linea of cuerpo) {
    // Una exclusión cubre el resto de la línea, incluso tras punto y coma.
    // Las autorizaciones independientes deben escribirse en otra línea.
    const corte = linea.search(RE_EXCLUSION);
    const antes = corte < 0 ? linea : linea.slice(0, corte);
    const despues = corte < 0 ? "" : linea.slice(corte);
    tokensGraves(antes).forEach(t => registrar(t, incluidas, "plan"));
    tokensGraves(despues, true).forEach(t => registrar(t, excluidas, "plan"));
  }
  if (error) return sinVerificar(error);

  for (const tramo of tramos) {
    if (segmento === undefined || tramo.n > segmento) continue;
    for (const linea of tramo.texto.split("\n")) {
      const m = linea.trim().match(RE_TRAMO_LINEA);
      if (!m) continue;
      for (const bruto of tokensTramo(m[2])) {
        const c = candidato(bruto);
        if (c.error) return sinVerificar(c.error);
        if (!c.ignorar) incluidas.push({ ruta: c.ruta, origen: `tramo-${tramo.n}` });
      }
    }
  }

  if (incluidas.length === 0) return sinVerificar("Scope sin rutas");
  const alcance = { incluidas, excluidas };
  if (incluidas.every(i => clasificarRuta(i.ruta, alcance) === "excluida")) {
    return sinVerificar("la exclusión cubre todo lo incluido");
  }
  return { estado: "ok", motivo: null, incluidas, excluidas, avisos };
}
