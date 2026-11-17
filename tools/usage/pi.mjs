import { basename, relative, sep } from "node:path";
import { leerJsonl, listarJsonl, reciente } from "./jsonl.mjs";

const PATRON_ESPERA_PI = /wait|sleep|send/i;

export function crearProcesadorPi(dependencias) {
  const {
    agregar, argumentosDe, coincide, comandoDe, creditosSesion, esPermitida,
    esSondeo, esVerify, estadisticasContexto, fechaUTC, num, proyectoDeDir,
    sumarTokens,
  } = dependencias;
  return async function procesarPi(ctx, raiz) {
    for (const ruta of listarJsonl(raiz, () => true)) {
      const partes = relative(raiz, ruta).split(sep);
      const proyecto = partes.length > 1 ? proyectoDeDir(partes[0]) : "desconocido";
      if (!coincide(ctx, proyecto) || !reciente(ruta, ctx.o.inicioMs)) continue;
      const rol = partes.some((p) => p.startsWith("subagent")) ? "sub" : "main";
      const mensajes = [];
      const limites = [];
      let esperas = 0;
      let sondeos = 0;
      let ediciones = 0;
      let verifys = 0;
      let primerTs = null;
      try {
        await leerJsonl(ruta, (obj) => {
          if (primerTs === null && typeof obj.timestamp === "string") primerTs = obj.timestamp;
          const m = obj.message;
          if (!m || typeof m !== "object" || m.role !== "assistant") return;
          if (m.stopReason === "error" && /usage limit/i.test(String(m.errorMessage ?? ""))) {
            limites.push(typeof obj.timestamp === "string" ? obj.timestamp : null);
            return;
          }
          // Esperas: llamadas de herramienta cuyo nombre contiene wait, sleep o send.
          if (Array.isArray(m.content)) {
            for (const b of m.content) {
              if (b && b.type === "toolCall" && typeof b.name === "string" && PATRON_ESPERA_PI.test(b.name)) esperas++;
              if (b && b.type === "toolCall" && typeof b.name === "string" && esSondeo(b.name, b.arguments)) sondeos++;
              if (b && b.type === "toolCall" && (b.name === "edit" || b.name === "write")) {
                const a = argumentosDe(b.arguments);
                const f = a?.path ?? a?.file_path;
                if (typeof f === "string" && !esPermitida(f)) ediciones++;
              }
              if (b && b.type === "toolCall" && b.name === "bash" && esVerify(comandoDe(b.arguments))) verifys++;
            }
          }
          const u = m.usage;
          if (!u || typeof u !== "object") return;
          mensajes.push({
            modelo: typeof m.model === "string" ? m.model : "desconocido",
            entrada: num(u.input),
            cache_leida: num(u.cacheRead),
            cache_escrita: num(u.cacheWrite),
            salida: num(u.output),
            contexto: num(u.input) + num(u.cacheRead),
          });
        });
      } catch (e) {
        ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
        continue;
      }
      const fecha = fechaUTC(primerTs);
      if (!fecha) continue;
      if (ctx.o.sesiones && rol === "main" && fecha >= ctx.o.desde) {
        const modelo = mensajes.at(-1)?.modelo ?? "desconocido";
        ctx.sesiones.push({
          herramienta: "pi", fecha, proyecto, sesion: basename(ruta), modelo,
          llamadas: mensajes.length, esperas, sondeos, ediciones_fuera: ediciones, corridas_verify: verifys,
          creditos: creditosSesion(ctx.tarifas, modelo, sumarTokens(mensajes)),
          ...estadisticasContexto(mensajes.map((x) => x.contexto)),
        });
      }
      for (const ts of limites) {
        const f = fechaUTC(ts);
        if (f === null || f >= ctx.o.desde) ctx.avisos.push(`Pi: límite de uso alcanzado en ${proyecto} (${ts ?? "sin fecha"}); no suma tokens`);
      }
      for (const x of mensajes) {
        agregar(ctx, { herramienta: "pi", fecha, proyecto, modelo: x.modelo, rol, sesion: ruta, llamadas: 1,
          entrada: x.entrada, cache_leida: x.cache_leida, cache_escrita: x.cache_escrita, salida: x.salida });
      }
    }
  };
}
