import { basename } from "node:path";
import { leerJsonl, listarJsonl, reciente } from "./jsonl.mjs";

const MUESTRA_MINIMA = 5;
const ESPERAS = new Set(["wait_agent", "wait", "sleep", "send_message"]);
// Un write_stdin puede venir como llamada directa o como `tools.write_stdin(` dentro del JS de un `exec`.
const LLAMADA_WRITE_STDIN = /tools\.write_stdin\(/g;

// Cuenta las ocurrencias de `tools.write_stdin(` en un texto (aproximación: un bucle cuenta una vez por línea de llamada).
function contarWriteStdin(texto) {
  return (texto.match(LLAMADA_WRITE_STDIN) ?? []).length;
}

// Milisegundos de un timestamp ISO, o null si no es válido.
function msDeTs(ts) {
  if (typeof ts !== "string") return null;
  const ms = Date.parse(ts);
  return Number.isNaN(ms) ? null : ms;
}

// El procesador recibe las reglas compartidas para conservar el contrato del medidor.
export function crearProcesadorCodex({
  agregar,
  coincide,
  comandoDe,
  creditosSesion,
  esPermitida,
  esSondeo,
  esVerify,
  estadisticasContexto,
  fechaUTC,
  num,
  rutasDeParche,
  rutasDeShell,
  textoDePatch,
}) {
  // Lee todas las sesiones de Codex (también las de otros proyectos, porque todas gastan la misma cuota),
  // agrega las filas de uso y calcula la calibración de cuota.
  async function procesarCodex(ctx, raiz) {
    const sesiones = [];
    for (const ruta of listarJsonl(raiz, (n) => n.startsWith("rollout-"))) {
      if (!reciente(ruta, ctx.o.inicioMs)) continue;
      let primerTs = null;
      let ultimoTs = null;
      let cwd = null;
      let modelo = null;
      let total = null;
      let llamadas = 0;
      let esperas = 0;
      let sondeos = 0;
      let writeStdin = 0;
      let ediciones = 0;
      let verifys = 0;
      const contextos = [];
      let cuotaInicial = null;
      let cuotaFinal = null;
      let primariaFinal = null;
      try {
        await leerJsonl(ruta, (obj) => {
          if (typeof obj.timestamp === "string") {
            if (primerTs === null) primerTs = obj.timestamp;
            ultimoTs = obj.timestamp;
          }
          const p = obj.payload && typeof obj.payload === "object" ? obj.payload : null;
          if (!p) return;
          if (obj.type === "session_meta" && typeof p.cwd === "string") cwd = p.cwd;
          if (obj.type === "turn_context" && typeof p.model === "string") modelo = p.model;
          if (obj.type === "response_item" && p.type === "function_call" && ESPERAS.has(p.name)) esperas++;
          if (obj.type === "response_item" && p.type === "function_call" && esSondeo(p.name, p.arguments)) sondeos++;
          if (obj.type === "response_item" && p.type === "function_call" && p.name === "write_stdin") writeStdin++;
          if (obj.type === "response_item" && p.type === "custom_tool_call" && p.name === "exec" && typeof p.input === "string") {
            writeStdin += contarWriteStdin(p.input);
          }
          // Ediciones fuera de lo permitido: apply_patch y escrituras de shell (cat >, tee, open(…, "w") y write_text).
          if (obj.type === "response_item" && (p.type === "custom_tool_call" || p.type === "function_call") && p.name === "apply_patch") {
            ediciones += rutasDeParche(textoDePatch(p)).filter((r) => !esPermitida(r)).length;
          }
          if (obj.type === "response_item" && p.type === "function_call" && (p.name === "exec_command" || p.name === "shell")) {
            const cmd = comandoDe(p.arguments);
            ediciones += rutasDeShell(cmd).filter((r) => !esPermitida(r)).length;
            if (esVerify(cmd)) verifys++;
          }
          if (p.type !== "token_count") return;
          const usado = p.rate_limits?.secondary?.used_percent;
          if (typeof usado === "number" && Number.isFinite(usado)) {
            if (cuotaInicial === null) cuotaInicial = usado;
            cuotaFinal = usado;
          }
          const ventana = p.rate_limits?.primary?.used_percent;
          if (typeof ventana === "number" && Number.isFinite(ventana)) primariaFinal = ventana;
          if (p.info && typeof p.info === "object") {
            llamadas++;
            if (p.info.total_token_usage && typeof p.info.total_token_usage === "object") total = p.info.total_token_usage;
            const contexto = p.info.last_token_usage?.input_tokens;
            if (typeof contexto === "number" && Number.isFinite(contexto)) contextos.push(contexto);
          }
        });
      } catch (e) {
        ctx.avisos.push(`no pude leer ${ruta}: ${e.message}`);
        continue;
      }
      sesiones.push({
        ruta,
        fecha: fechaUTC(primerTs),
        inicioMs: msDeTs(primerTs),
        finMs: msDeTs(ultimoTs),
        proyecto: cwd ? (cwd.split(/[\\/]/).filter(Boolean).pop() ?? "desconocido") : "desconocido",
        modelo: modelo ?? "desconocido",
        llamadas,
        esperas,
        sondeos,
        writeStdin,
        ediciones,
        verifys,
        contextos,
        total,
        cuotaInicial,
        cuotaFinal,
        primariaFinal,
      });
    }
    for (const s of sesiones) {
      if (!s.fecha || s.llamadas === 0 || !s.total || !coincide(ctx, s.proyecto)) continue;
      const cacheada = num(s.total.cached_input_tokens);
      agregar(ctx, { herramienta: "codex", fecha: s.fecha, proyecto: s.proyecto, modelo: s.modelo, rol: "main", sesion: s.ruta,
        llamadas: s.llamadas, entrada: Math.max(0, num(s.total.input_tokens) - cacheada), cache_leida: cacheada, cache_escrita: 0,
        salida: num(s.total.output_tokens) });
    }
    ctx.cuota = calcularCuota(ctx, sesiones);
    // Alerta de cuota: la sesión más reciente con dato de cuota semanal; si ya llegó al umbral, avisa.
    const conCuota = sesiones.filter((s) => s.cuotaFinal !== null && s.finMs !== null && s.fecha && s.fecha >= ctx.o.desde && coincide(ctx, s.proyecto));
    if (conCuota.length > 0) {
      const ultima = conCuota.reduce((a, b) => (b.finMs > a.finMs ? b : a));
      if (ultima.cuotaFinal >= ctx.o.umbral) {
        ctx.avisos.push(`Cuota semanal de Codex en ${ultima.cuotaFinal} %: llegó al umbral de ${ctx.o.umbral} %`);
      }
    }
    // Alerta de ventana de 5 horas: rate_limits.primary de la sesión más reciente con ese dato.
    const conVentana = sesiones.filter((s) => s.primariaFinal !== null && s.finMs !== null && s.fecha && s.fecha >= ctx.o.desde && coincide(ctx, s.proyecto));
    if (conVentana.length > 0) {
      const ultima = conVentana.reduce((a, b) => (b.finMs > a.finMs ? b : a));
      if (ultima.primariaFinal >= ctx.o.umbral) ctx.avisos.push(`Ventana de 5 horas de Codex en ${ultima.primariaFinal} %`);
    }
    // Diagnóstico por sesión (--sessions): sin la ruta completa, solo el nombre del archivo.
    if (ctx.o.sesiones) {
      for (const s of sesiones.filter((x) => x.fecha && x.fecha >= ctx.o.desde && coincide(ctx, x.proyecto))) {
        const t = s.total ? {
          entrada: Math.max(0, num(s.total.input_tokens) - num(s.total.cached_input_tokens)),
          cache_leida: num(s.total.cached_input_tokens),
          cache_escrita: 0,
          salida: num(s.total.output_tokens),
        } : null;
        ctx.sesiones.push({
          herramienta: "codex", fecha: s.fecha, proyecto: s.proyecto, sesion: basename(s.ruta), modelo: s.modelo,
          llamadas: s.llamadas, esperas: s.esperas, sondeos: s.sondeos, write_stdin: s.writeStdin, ediciones_fuera: s.ediciones, corridas_verify: s.verifys,
          creditos: creditosSesion(ctx.tarifas, s.modelo, t),
          ...estadisticasContexto(s.contextos),
        });
      }
    }
  }

  // Puntos de cuota semanal por modelo. Solo cuentan sesiones exclusivas (su intervalo primer-último evento
  // no se cruza con ninguna otra sesión de Codex) y sin bajada de cuota (una bajada es un reinicio).
  // puntos = used_percent final - inicial; tokens = total_tokens final de la sesión.
  function calcularCuota(ctx, sesiones) {
    const grupos = new Map();
    for (const s of sesiones) {
      if (!s.fecha || s.fecha < ctx.o.desde || s.llamadas === 0 || !s.total || !coincide(ctx, s.proyecto)) continue;
      if (s.inicioMs === null || s.finMs === null || s.cuotaInicial === null || s.cuotaFinal === null) continue;
      if (s.cuotaFinal < s.cuotaInicial) continue;
      const cruza = sesiones.some((o) => o !== s && o.inicioMs !== null && o.finMs !== null
        && o.inicioMs < s.finMs && s.inicioMs < o.finMs);
      if (cruza) continue;
      const g = grupos.get(s.modelo) ?? { modelo: s.modelo, puntos: 0, tokens: 0, sesiones: 0 };
      g.puntos += s.cuotaFinal - s.cuotaInicial;
      g.tokens += num(s.total.total_tokens);
      g.sesiones++;
      grupos.set(s.modelo, g);
    }
    const cuota = [...grupos.values()]
      .sort((a, b) => (a.modelo < b.modelo ? -1 : a.modelo > b.modelo ? 1 : 0))
      .map((g) => ({ ...g, puntos: Math.round(g.puntos * 100) / 100 }));
    for (const g of cuota) {
      if (g.sesiones < MUESTRA_MINIMA) {
        ctx.avisos.push(`Codex: muestra pequeña para ${g.modelo} (${g.sesiones} sesiones; se recomiendan ${MUESTRA_MINIMA} o más)`);
      }
    }
    return cuota;
  }

  return procesarCodex;
}
