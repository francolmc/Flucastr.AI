import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

// Log de progreso por plan: una línea JSON por evento en changes/<nombre>/progress.jsonl.
// Solo se anexa. Nunca se leen archivos de producto ni contenido de archivos aquí:
// solo nombres de archivo, comandos y texto corto, redactados y truncados.

export const TIPOS = [
  "paso_iniciado",
  "archivo_editado",
  "comando_iniciado",
  "comando_terminado",
  "fingerprint_cambió",
  "casilla_marcada",
  "bloqueo",
  "nota",
];

export const LIMITE_COMANDO = 200;
export const LIMITE_TEXTO = 160;
const LIMITE_ARCHIVO = 200;

// Heurístico: cubre los casos conocidos y no garantiza cobertura total.
const PATRONES = [
  // clave=valor / clave: valor (incluye Authorization: Bearer <token>)
  [/([A-Za-z0-9_-]*(?:key|token|secret|password|passwd|authorization|bearer)[A-Za-z0-9_-]*\s*[=:]\s*)(?:bearer\s+)?[^\s'"]+/gi, "$1[redactado]"],
  // --password x, --token=x, --api-key x
  [/(--(?:password|passwd|token|secret|api-?key)(?:=|\s+))[^\s'"]+/gi, "$1[redactado]"],
  // ://usuario:clave@
  [/(:\/\/)[^:/\s@]+:[^@\s]+@/g, "$1[redactado]@"],
  // sk-…, ghp_… y similares, AKIA…
  [/\bsk-[A-Za-z0-9_-]{8,}/g, "[redactado]"],
  [/\bgh[pousr]_[A-Za-z0-9]{8,}/g, "[redactado]"],
  [/\bAKIA[0-9A-Z]{8,}/g, "[redactado]"],
  // hex ≥ 32
  [/\b[0-9a-fA-F]{32,}\b/g, "[redactado]"],
  // base64 ≥ 32 con letras y dígitos
  [/\b(?=[A-Za-z0-9+/]*\d)(?=[A-Za-z0-9+/]*[A-Za-z])[A-Za-z0-9+/]{32,}={0,2}/g, "[redactado]"],
];

export function redactar(texto) {
  let s = String(texto);
  for (const [patron, reemplazo] of PATRONES) s = s.replace(patron, reemplazo);
  return s;
}

export function truncar(texto, max) {
  const s = String(texto);
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function limpio(texto, max) {
  return truncar(redactar(texto), max);
}

// Construye un evento. Lanza si el tipo no está en la lista.
// Solo copia los campos permitidos; cmd y texto se redactan y truncan.
export function evento(tipo, campos = {}) {
  if (!TIPOS.includes(tipo)) throw new TypeError(`tipo de evento desconocido: ${tipo}`);
  const e = { t: new Date().toISOString(), seg: campos.seg ?? null, tipo, o: campos.o ?? "automatico" };
  if (campos.id != null) e.id = String(campos.id);
  if (campos.archivo != null) e.archivo = limpio(campos.archivo, LIMITE_ARCHIVO);
  if (campos.cmd != null) e.cmd = limpio(campos.cmd, LIMITE_COMANDO);
  if ("exit" in campos) e.exit = campos.exit === null || campos.exit === undefined ? null : Number(campos.exit);
  if (campos.ms != null) e.ms = Math.max(0, Math.round(Number(campos.ms)));
  if (campos.texto != null) e.texto = limpio(campos.texto, LIMITE_TEXTO);
  return e;
}

// Anexa un evento. Best effort: nunca lanza; avisa por stderr si no puede escribir.
export function anexar(ruta, evt) {
  try {
    if (!evt || !TIPOS.includes(evt.tipo)) throw new TypeError("evento inválido");
    mkdirSync(dirname(ruta), { recursive: true });
    appendFileSync(ruta, JSON.stringify(evt) + "\n");
    return true;
  } catch (e) {
    try { process.stderr.write(`progreso: no se pudo anexar a ${ruta} (${e.code ?? e.message})\n`); } catch {}
    return false;
  }
}

// Lee el log. Devuelve las líneas válidas y cuenta las corruptas o truncadas. Nunca lanza.
export function leerEventos(ruta) {
  const salida = { eventos: [], corruptas: 0 };
  let texto;
  try {
    if (!existsSync(ruta)) return salida;
    texto = readFileSync(ruta, "utf8");
  } catch {
    return salida;
  }
  for (const linea of texto.split("\n")) {
    if (!linea.trim()) continue;
    let obj;
    try { obj = JSON.parse(linea); } catch { salida.corruptas++; continue; }
    if (obj && typeof obj === "object" && TIPOS.includes(obj.tipo) && typeof obj.t === "string") {
      salida.eventos.push(obj);
    } else {
      salida.corruptas++;
    }
  }
  return salida;
}
