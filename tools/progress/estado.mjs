// Cálculo del estado de progreso a partir de los eventos. Función pura: no lee ni escribe archivos.
// Señales: «esperando comando» (comando en curso, sin importar su duración),
// «avanzando» (actividad dentro del umbral), «sin actividad» (fuera del umbral y sin comando en curso).

export const UMBRAL_POR_DEFECTO = 120;
export const INTERVALO_POR_DEFECTO = 60;

function ms(t) {
  const n = Date.parse(t);
  return Number.isNaN(n) ? null : n;
}

export function calcularEstado(eventos, { ahora = Date.now(), umbralSeg = UMBRAL_POR_DEFECTO, intervaloSeg = INTERVALO_POR_DEFECTO, casillas = null } = {}) {
  let segmento = null;
  let paso = null;
  let ultimoArchivo = null;
  let ultimoComando = null;
  let ultimaActividad = null;
  const abiertos = [];
  let cambiosHuella = 0;
  const inicioIntervalo = ahora - intervaloSeg * 1000;

  for (const e of eventos) {
    if (e.seg != null && e.seg !== "") segmento = e.seg;
    const tiempo = ms(e.t);
    if (tiempo !== null && (ultimaActividad === null || tiempo > ultimaActividad)) ultimaActividad = tiempo;

    if (e.tipo === "paso_iniciado") paso = e.texto ?? null;
    if (e.tipo === "archivo_editado") ultimoArchivo = e.archivo ?? null;
    if (e.tipo === "fingerprint_cambió" && tiempo !== null && tiempo >= inicioIntervalo) cambiosHuella++;

    if (e.tipo === "comando_iniciado") {
      abiertos.push(e);
      ultimoComando = { cmd: e.cmd ?? null, exit: null, ms: null, id: e.id ?? null, inicio: tiempo, enCurso: true };
    } else if (e.tipo === "comando_terminado") {
      let idx = -1;
      if (e.id != null) idx = abiertos.findIndex((c) => c.id === e.id);
      else if (abiertos.length) idx = abiertos.length - 1;
      if (idx >= 0) abiertos.splice(idx, 1);
      if (ultimoComando && (e.id == null || ultimoComando.id === e.id)) {
        ultimoComando.exit = e.exit ?? null;
        ultimoComando.ms = e.ms ?? null;
        ultimoComando.enCurso = false;
      }
    }
  }

  const enCurso = ultimoComando?.enCurso === true;
  if (enCurso && ultimoComando.inicio !== null) {
    ultimoComando.ms = Math.max(0, ahora - ultimoComando.inicio);
  }
  const segundosDesdeActividad = ultimaActividad === null ? null : Math.max(0, Math.round((ahora - ultimaActividad) / 1000));

  let senal;
  if (enCurso) senal = "esperando comando";
  else if (segundosDesdeActividad !== null && segundosDesdeActividad <= umbralSeg) senal = "avanzando";
  else senal = "sin actividad";

  return {
    segmento,
    paso,
    ultimoArchivo,
    ultimoComando: ultimoComando ? { cmd: ultimoComando.cmd, exit: ultimoComando.exit, ms: ultimoComando.ms, enCurso } : null,
    segundosDesdeActividad,
    senal,
    cambiosHuella,
    casillas,
  };
}
