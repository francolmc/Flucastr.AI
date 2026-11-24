import { leerJsonl } from "../usage/jsonl.mjs";
import { evento } from "./eventos.mjs";

// Lee una sesión de Pi (.jsonl) y devuelve eventos de progreso.
// Solo usa estructura: nombre de herramienta, ids, duración y el comando o la ruta (redactados y truncados).
// Las líneas truncadas o corruptas las salta leerJsonl; no se cuentan aquí.

const RE_EXIT = /(?:exited with code|exit code|exit)\s+(-?\d+)/i;

function exitDe(texto) {
  const m = RE_EXIT.exec(String(texto ?? ""));
  return m ? Number(m[1]) : null;
}

// Devuelve { cwd, fecha, eventos }. bash da comando_iniciado y comando_terminado (exit solo si el
// resultado lo trae; si no, null). edit y write dan archivo_editado. Otras herramientas no se leen.
export async function leerSesionPi(ruta, { seg = null } = {}) {
  const salida = { cwd: null, fecha: null, eventos: [] };
  const bash = new Set(); // ids de toolCall que son bash

  await leerJsonl(ruta, (obj) => {
    if (obj.type === "session") {
      salida.cwd = obj.cwd ?? salida.cwd;
      salida.fecha = obj.timestamp ?? salida.fecha;
      return;
    }
    const m = obj.message;
    if (!m) return;

    if (m.role === "assistant" && Array.isArray(m.content)) {
      for (const b of m.content) {
        if (b?.type !== "toolCall") continue;
        const args = b.arguments ?? {};
        if (b.name === "bash") {
          bash.add(b.id);
          salida.eventos.push(evento("comando_iniciado", { seg, id: b.id, cmd: args.command }));
        } else if (b.name === "edit" || b.name === "write") {
          salida.eventos.push(evento("archivo_editado", { seg, id: b.id, archivo: args.path }));
        }
      }
      return;
    }

    if (m.role === "toolResult" && bash.has(m.toolCallId)) {
      const texto = (Array.isArray(m.content) ? m.content : [])
        .filter((x) => x?.type === "text")
        .map((x) => x.text)
        .join("\n");
      salida.eventos.push(
        evento("comando_terminado", {
          seg,
          id: m.toolCallId,
          exit: exitDe(texto),
          ms: m.durationMs,
        }),
      );
      bash.delete(m.toolCallId);
    }
  });
  return salida;
}
