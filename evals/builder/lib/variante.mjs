// Variante de un tramo (A5, D-06): copia del kit con su contrato (builder y execute-plan) y sus valores
// de nivel, esfuerzo y ventana. Todo cambio va a la copia; el repo no se toca. Devuelve el entorno para
// `kit run`: HOME temporal con `.agents/skills` enlazado a las skills de la copia y `.codex` enlazado a la
// carpeta real de Codex, que se resuelve antes de cambiar HOME. Esa carpeta nunca se lee, solo se enlaza.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ_KIT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
// Archivos de contrato del kit y su ruta relativa a la raíz de la copia.
const CONTRATO = {
  builder: "core/agents/builder.md",
  execute_plan: "core/skills/execute-plan/SKILL.md",
};
// adapters/ va en la copia porque `kit run` lo importa (scripts/resolver.mjs); D-26.
const COPIAS = ["core", "scripts", "tools", "adapters", "models.json"];
const CAMPOS = ["contrato", "nivel", "esfuerzo", "ventana"];
const NOMBRE = /^[a-z0-9][a-z0-9-]*$/;

export class ErrorVariante extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorVariante";
    this.codigo = 2;
  }
}

function fallo(mensaje) {
  throw new ErrorVariante(mensaje);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Mismos nombres que copia.mjs: .env (salvo .env.example), llaves y certificados no se copian.
function esSecreto(nombre) {
  if (nombre === ".env.example") return false;
  return /^\.env(\.|$)/.test(nombre) || /\.(pem|key|p12|pfx)$/.test(nombre) || /^id_(rsa|ed25519|ecdsa)$/.test(nombre);
}

function filtrarCopia(origen) {
  const nombre = basename(origen);
  return nombre !== ".git" && nombre !== "node_modules" && !esSecreto(nombre);
}

// Lee y valida la variante. Las rutas de contrato quedan absolutas, relativas al archivo de la variante.
export function leerVariante(rutaJson) {
  const dir = dirname(resolve(rutaJson));
  let v;
  try {
    v = JSON.parse(readFileSync(rutaJson, "utf8"));
  } catch {
    fallo(`variante ilegible o no JSON: ${basename(rutaJson)}`);
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) fallo("la variante debe ser un objeto");
  if (typeof v.nombre !== "string" || !NOMBRE.test(v.nombre)) fallo("nombre de variante inválido");
  const desconocidos = Object.keys(v).filter((k) => k !== "nombre" && !CAMPOS.includes(k));
  if (desconocidos.length > 0) fallo(`campos desconocidos: ${desconocidos.join(", ")}`);

  const salida = { nombre: v.nombre, contrato: null, nivel: undefined, esfuerzo: undefined, ventana: undefined };
  if ("contrato" in v) {
    if (!v.contrato || typeof v.contrato !== "object" || Array.isArray(v.contrato)) fallo("contrato nulo o no es un objeto");
    const claves = Object.keys(v.contrato);
    if (claves.length === 0 || claves.some((k) => !Object.hasOwn(CONTRATO, k))) fallo("contrato admite solo builder y execute_plan");
    salida.contrato = {};
    for (const k of claves) {
      const ruta = v.contrato[k];
      if (typeof ruta !== "string" || ruta === "" || isAbsolute(ruta) || ruta.split(/[\\/]/).includes("..")) {
        fallo(`ruta de contrato inválida: ${k}`);
      }
      salida.contrato[k] = resolve(dir, ruta);
    }
  }
  if ("nivel" in v) {
    if (typeof v.nivel !== "string") fallo("nivel debe ser texto");
    salida.nivel = v.nivel;
  }
  if ("esfuerzo" in v) {
    if (typeof v.esfuerzo !== "string") fallo("esfuerzo debe ser texto");
    salida.esfuerzo = v.esfuerzo;
  }
  if ("ventana" in v) {
    if (!Number.isInteger(v.ventana) || v.ventana <= 0) fallo("ventana debe ser un entero positivo");
    salida.ventana = v.ventana;
  }
  return salida;
}

function leerContrato(clave, ruta) {
  try {
    return readFileSync(ruta);
  } catch {
    fallo(`no se puede leer el contrato ${clave}`);
  }
}

// Archivos de un árbol (relativos, con «/») y, para enlaces, su destino en lugar del contenido.
function listarArchivos(dir, rel = "", salida = []) {
  for (const entrada of readdirSync(join(dir, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const ruta = rel ? `${rel}/${entrada.name}` : entrada.name;
    if (!filtrarCopia(join(dir, ruta))) continue;
    if (entrada.isDirectory()) listarArchivos(dir, ruta, salida);
    else if (entrada.isSymbolicLink()) salida.push({ ruta, bytes: Buffer.from(readlinkSync(join(dir, ruta))) });
    else if (entrada.isFile()) salida.push({ ruta, bytes: readFileSync(join(dir, ruta)) });
  }
  return salida;
}

// Huellas separadas (D-26): `kit` cubre la copia sin los archivos de contrato ni models.json; `modelos` cubre
// solo models.json con los valores de la variante; `contrato` cubre solo los archivos de contrato aplicados.
function huellasDe(destino) {
  const contratoRutas = Object.values(CONTRATO);
  const archivos = listarArchivos(destino);
  const delKit = archivos.filter((a) => !contratoRutas.includes(a.ruta) && a.ruta !== "models.json");
  const kit = sha256(delKit.map((a) => `${a.ruta}\0${sha256(a.bytes)}\n`).join(""));
  const hallado = archivos.find((a) => a.ruta === "models.json");
  const modelos = hallado ? sha256(hallado.bytes) : "ausente";
  const contrato = sha256(
    Object.entries(CONTRATO)
      .map(([clave, ruta]) => {
        const hallado = archivos.find((a) => a.ruta === ruta);
        return `${clave}\0${hallado ? sha256(hallado.bytes) : "ausente"}\n`;
      })
      .join(""),
  );
  return { kit, contrato, modelos };
}

// Prepara la copia y el entorno de la variante. `codexReal` (por defecto CODEX_HOME o ~/.codex) se resuelve
// aquí, antes de que el entorno devuelto cambie HOME. Si algo falla, borra la copia y el HOME temporal.
export function prepararVariante({
  variante,
  destino,
  raiz = RAIZ_KIT,
  codexReal = process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : join(homedir(), ".codex"),
}) {
  const v = leerVariante(variante);
  if (existsSync(destino)) fallo("el destino de la variante ya existe");
  const modelosKit = JSON.parse(readFileSync(join(raiz, "models.json"), "utf8"));
  if (v.nivel !== undefined && !modelosKit.levels.includes(v.nivel)) fallo(`nivel fuera de levels: ${v.nivel}`);
  if (v.esfuerzo !== undefined && !modelosKit.efforts.includes(v.esfuerzo)) fallo(`esfuerzo fuera de efforts: ${v.esfuerzo}`);
  if (!existsSync(codexReal)) fallo("la carpeta de Codex no existe");

  // Contrato igual al base: falla si todos sus archivos son idénticos a los del árbol de trabajo.
  const contratoLeido = {};
  if (v.contrato) {
    for (const clave of Object.keys(v.contrato)) contratoLeido[clave] = leerContrato(clave, v.contrato[clave]);
    const igualAlBase = Object.keys(contratoLeido).every((clave) => {
      const base = join(raiz, CONTRATO[clave]);
      return existsSync(base) && readFileSync(base).equals(contratoLeido[clave]);
    });
    if (igualAlBase) fallo("el contrato de la variante es igual al base");
  }

  let home;
  try {
    mkdirSync(destino, { recursive: true });
    for (const r of COPIAS) cpSync(join(raiz, r), join(destino, r), { recursive: true, filter: filtrarCopia });

    for (const clave of Object.keys(contratoLeido)) {
      const dest = join(destino, CONTRATO[clave]);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, contratoLeido[clave]);
    }

    const cambiaModelos = v.nivel !== undefined || v.esfuerzo !== undefined || v.ventana !== undefined;
    if (cambiaModelos) {
      const rutaModelos = join(destino, "models.json");
      const modelos = JSON.parse(readFileSync(rutaModelos, "utf8"));
      const builder = modelos.agents?.builder;
      if (!builder || typeof builder !== "object") fallo("models.json no tiene agents.builder");
      if (v.nivel !== undefined) builder.level = v.nivel;
      if (v.esfuerzo !== undefined) builder.effort = v.esfuerzo;
      if (v.ventana !== undefined) builder.compact_at = { ...(builder.compact_at ?? {}), codex: v.ventana };
      writeFileSync(rutaModelos, `${JSON.stringify(modelos, null, 2)}\n`);
    }

    // HOME temporal: las skills del kit enlazadas a la copia y .codex enlazado a la carpeta real.
    home = mkdtempSync(join(tmpdir(), "variante-home-"));
    const skills = join(destino, "core", "skills");
    mkdirSync(join(home, ".agents", "skills"), { recursive: true });
    for (const entrada of readdirSync(skills, { withFileTypes: true })) {
      if (entrada.isDirectory()) symlinkSync(join(skills, entrada.name), join(home, ".agents", "skills", entrada.name));
    }
    symlinkSync(codexReal, join(home, ".codex"));

    const huellas = huellasDe(destino);
    const dirHome = home;
    let limpiada = false;
    const limpiar = () => {
      if (limpiada) return;
      limpiada = true;
      rmSync(dirHome, { recursive: true, force: true });
      rmSync(destino, { recursive: true, force: true });
    };
    return {
      destino,
      home: dirHome,
      env: { HOME: dirHome, FLUCASTR_MODELOS: join(destino, "models.json") },
      huellas,
      limpiar,
    };
  } catch (error) {
    rmSync(destino, { recursive: true, force: true });
    if (home) rmSync(home, { recursive: true, force: true });
    throw error;
  }
}
