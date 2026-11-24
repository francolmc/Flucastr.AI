import { leerJsonl } from "../usage/jsonl.mjs";
import { evento } from "./eventos.mjs";

// Lee una sesión de Codex (rollout-*.jsonl) y devuelve eventos de progreso.
// Solo usa estructura: nombres de herramienta, ids, tiempos y el comando (redactado y truncado).
// Las líneas truncadas o corruptas las salta leerJsonl; no se cuentan aquí.

const RE_EXIT = /(?:exited with code|exit code|exit)\s+(-?\d+)/i;
const RE_CELDA = /Script running with cell ID (\d+)/;

function exitDe(texto) {
  const m = RE_EXIT.exec(String(texto ?? ""));
  return m ? Number(m[1]) : null;
}

function aArgs(valor) {
  if (valor && typeof valor === "object") return valor;
  try {
    return JSON.parse(valor ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function msEntre(desde, hasta) {
  const a = Date.parse(desde);
  const b = Date.parse(hasta);
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : undefined;
}

// Devuelve { cwd, fecha, eventos }. Un comando sale como comando_iniciado al llamarlo y
// como comando_terminado cuando su salida o la de la espera (wait) de su celda llega.
// Si la salida dice «Script running», el comando sigue activo y no se cierra todavía.
export async function leerSesionCodex(ruta, { seg = null } = {}) {
  const salida = { cwd: null, fecha: null, eventos: [] };
  const iniciados = new Map(); // call_id -> { ts }
  const esperas = new Map(); // call_id de wait -> cell_id
  const celdas = new Map(); // cell_id -> call_id del comando de origen
  const cerrados = new Set();

  const cerrar = (origen, salidaTexto, ts) => {
    if (!origen || cerrados.has(origen) || !iniciados.has(origen)) return;
    cerrados.add(origen);
    const inicio = iniciados.get(origen);
    salida.eventos.push(
      evento("comando_terminado", {
        seg,
        id: origen,
        exit: exitDe(salidaTexto),
        ms: msEntre(inicio.ts, ts),
      }),
    );
  };

  const iniciar = (callId, cmd, ts) => {
    if (!callId || iniciados.has(callId)) return;
    iniciados.set(callId, { ts });
    salida.eventos.push(evento("comando_iniciado", { seg, id: callId, cmd }));
  };

  await leerJsonl(ruta, (obj) => {
    const p = obj.payload;
    if (obj.type === "session_meta" && p) {
      salida.cwd = p.cwd ?? salida.cwd;
      salida.fecha = p.timestamp ?? obj.timestamp ?? salida.fecha;
      return;
    }
    if (obj.type !== "response_item" || !p) return;
    const ts = obj.timestamp;

    if (p.type === "function_call" && p.name === "exec_command") {
      iniciar(p.call_id, aArgs(p.arguments).cmd, ts);
      return;
    }
    if (p.type === "custom_tool_call" && p.name === "exec") {
      iniciar(p.call_id, p.input, ts);
      return;
    }
    if (p.type === "function_call" && p.name === "wait") {
      const cell = aArgs(p.arguments).cell_id;
      if (cell != null) esperas.set(p.call_id, String(cell));
      return;
    }
    if (p.type === "function_call_output" || p.type === "custom_tool_call_output") {
      const texto = typeof p.output === "string" ? p.output : JSON.stringify(p.output ?? "");
      if (esperas.has(p.call_id)) {
        // La espera devuelve la salida final de la celda; si sigue corriendo, no cierra nada.
        if (RE_CELDA.test(texto)) return;
        const cell = esperas.get(p.call_id);
        cerrar(celdas.get(cell), texto, ts);
        celdas.delete(cell);
        return;
      }
      const celda = RE_CELDA.exec(texto);
      if (celda) {
        celdas.set(celda[1], p.call_id);
        return;
      }
      cerrar(p.call_id, texto, ts);
    }
  });
  return salida;
}
