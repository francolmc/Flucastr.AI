import { basename, relative, sep } from "node:path";
import { leerJsonl, listarJsonl, reciente } from "./jsonl.mjs";

const ESPERAS_CLAUDE = new Set(["TaskOutput", "Sleep", "Monitor", "SendMessage"]);
const HERRAMIENTAS_EDICION_CLAUDE = new Set(["Edit", "Write"]);

export function crearProcesadorClaude(dependencias) {
  const {
    agregar, coincide, fechaUTC, esPermitida, esVerify,
    estadisticasContexto, num, proyectoDeDir,
  } = dependencias;
  return async function procesarClaude(ctx, raiz) {
    for (const ruta of listarJsonl(raiz, () => true)) {
      const partes = relative(raiz, ruta).split(sep);
      const proyecto = partes.length > 1 ? proyectoDeDir(partes[0]) : "desconocido";
      if (!coincide(ctx, proyecto) || !reciente(ruta, ctx.o.inicioMs)) continue;
      const rol = partes.some((p) => p.startsWith("subagent")) ? "sub" : "main";
      const mensajes = [];
      const esperas = new Set();
      const usosVistos = new Set();
      let ediciones = 0;
      let verifys = 0;
      let primerTs = null;
      try {
        await leerJsonl(ruta, (obj) => {
          if (primerTs === null && typeof obj.timestamp === "string") primerTs = obj.timestamp;
          const m = obj.message;
          if (!m || typeof m !== "object" || m.role !== "assistant") return;
          // Esperas, ediciones fuera de lo permitido y corridas de verify: bloques tool_use, contados una vez por id (un mensaje se repite en varias líneas).
          if (Array.isArray(m.content)) {
            m.content.forEach((b, i) => {
              if (!b || b.type !== "tool_use") return;
              const id = typeof b.id === "string" ? b.id : `${m.id}|${i}`;
              if (ESPERAS_CLAUDE.has(b.name)) esperas.add(id);
              if (usosVistos.has(id)) return;
              usosVistos.add(id);
              if (HERRAMIENTAS_EDICION_CLAUDE.has(b.name) && b.input && typeof b.input.file_path === "string" && !esPermitida(b.input.file_path)) ediciones++;
              if (b.name === "Bash" && esVerify(b.input?.command)) verifys++;
            });
          }
          if (!m.usage || typeof m.usage !== "object") return;
          mensajes.push({
            clave: typeof m.id === "string" ? `${m.id}|${obj.requestId ?? ""}` : null,
            modelo: typeof m.model === "string" ? m.model : "desconocido",
            entrada: num(m.usage.input_tokens),
            cache_leida: num(m.usage.cache_read_input_tokens),
            cache_escrita: num(m.usage.cache_creation_input_tokens),
            salida: num(m.usage.output_tokens),
            contexto: num(m.usage.input_tokens) + num(m.usage.cache_read_input_tokens) + num(m.usage.cache_creation_input_tokens),
          });
        });
      } catch (e) {
        ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
        continue;
      }
      const fecha = fechaUTC(primerTs);
      if (!fecha) continue;
      if (ctx.o.sesiones && rol === "main" && fecha >= ctx.o.desde) {
        // Una fila por sesión principal: cada llamada cuenta una vez (por id de mensaje) y los subagentes no entran.
        const vistos = new Set();
        const contextos = [];
        for (const x of mensajes) {
          if (x.clave !== null) {
            if (vistos.has(x.clave)) continue;
            vistos.add(x.clave);
          }
          contextos.push(x.contexto);
        }
        ctx.sesiones.push({
          herramienta: "claude", fecha, proyecto, sesion: basename(ruta), modelo: mensajes.at(-1)?.modelo ?? "desconocido",
          llamadas: contextos.length, esperas: esperas.size, creditos: null, sondeos: null, ediciones_fuera: ediciones, corridas_verify: verifys,
          ...estadisticasContexto(contextos),
        });
      }
      for (const x of mensajes) {
        if (x.clave !== null) {
          if (ctx.vistos.has(x.clave)) continue;
          ctx.vistos.add(x.clave);
        }
        agregar(ctx, { herramienta: "claude", fecha, proyecto, modelo: x.modelo, rol, sesion: ruta, llamadas: 1,
          entrada: x.entrada, cache_leida: x.cache_leida, cache_escrita: x.cache_escrita, salida: x.salida });
      }
    }
  };
}
