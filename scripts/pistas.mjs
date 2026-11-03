#!/usr/bin/env node
// Pistas accionables del informe (`informe.mjs --pistas`), pistas 1 a 6 de definitions/DIAGNOSTICO-BLOQUEOS.md (§5).
// Función pura: recibe eventos ya validados y no lee archivos ni git. Los umbrales son supuestos a calibrar.
// Pistas 2 y 6: usan `corridas` (sesion.subagentes.corridas) y `consumo` (bloqueConsumo); sin ellos no se evalúan.

export const UMBRAL_CANCELADAS = 0.3;
export const UMBRAL_DEFINIR = 0.6;

const ACCION = {
  1: "Añade `Requiere:` a sus tareas o arregla el entorno antes de aprobar.",
  2: "Esa vuelta no podía arreglarlo: usa `rol=franco`.",
  3: "Se planifica de más: baja el tamaño de la feature o valida la idea antes de descomponer.",
  4: "Corre la validación con el lanzador; falta aplicar §3.",
  5: "El planificador omite decisiones: revisa `Fuente:` y *Decisiones ya tomadas*.",
  6: "Pocos bloques de ejecución para el costo de definir: junta features chicas.",
};

const TIPOS_ALCANCE = ["alcance", "especificacion"];
const ROLES_DEFINIR = ["planificador", "arquitecto"];

function porFeature(eventos) {
  const mapa = new Map();
  const de = (f) => {
    if (!mapa.has(f)) {
      mapa.set(f, { bloqueos: [], entorno: new Set(), estados: new Map(), cancelaciones: new Set(), ejecuciones: 0, ejecutadas: new Set() });
    }
    return mapa.get(f);
  };
  for (const e of eventos) {
    if (typeof e.feature !== "string") continue;
    const f = de(e.feature);
    if (e.evento === "bloqueo") {
      f.bloqueos.push(e.tipo);
      if (e.tipo === "entorno") f.entorno.add(e.tarea);
    }
    else if (e.evento === "cancelacion") f.cancelaciones.add(e.tarea);
    else if (e.evento === "tarea_estado") {
      if (!f.estados.has(e.tarea)) f.estados.set(e.tarea, new Set());
      f.estados.get(e.tarea).add(e.a);
    } else if (e.evento === "ejecucion") {
      f.ejecuciones++;
      f.ejecutadas.add(e.tarea);
    }
  }
  return mapa;
}

// Devuelve [{ n, feature, medicion, accion }], ordenado por n y luego por feature.
export function calcularPistas(eventos, { corridas = null, consumo = null } = {}) {
  const pistas = [];
  const emitir = (n, feature, medicion) => pistas.push({ n, feature, medicion, accion: ACCION[n] });

  for (const [feature, f] of [...porFeature(eventos).entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    // Pista 1: dos o más bloqueos de entorno.
    const entorno = f.bloqueos.filter((t) => t === "entorno").length;
    if (entorno >= 2) emitir(1, feature, `${entorno} bloqueos tipo=entorno`);

    // Pista 2: corridas de planificador o arquitecto con Disparó: BLOQUEO a una tarea con bloqueo de entorno de la feature.
    // corrida.feature nula cuenta; si trae otra feature, no.
    if (corridas) {
      const vueltas = corridas.filter(
        (c) =>
          ROLES_DEFINIR.includes(c.rol) &&
          c.disparo?.origen === "bloqueo" &&
          f.entorno.has(c.disparo.tarea) &&
          (c.feature ?? feature) === feature,
      ).length;
      if (vueltas >= 1) emitir(2, feature, `${vueltas} vuelta(s) de entorno a planificador o arquitecto`);
    }

    // Pista 3: más del 30 % de las tareas con estado conocido acaban canceladas.
    const tareas = [...f.estados.keys()];
    const canceladas = tareas.filter((t) => f.estados.get(t).has("cancelada"));
    if (tareas.length > 0 && canceladas.length / tareas.length > UMBRAL_CANCELADAS) {
      const p = Math.round((canceladas.length * 100) / tareas.length);
      emitir(3, feature, `${canceladas.length} de ${tareas.length} tareas canceladas (${p} %)`);
    }

    // Pista 4, forma a: cancelada sin cancelacion (motivo).
    const sinMotivo = canceladas.filter((t) => !f.cancelaciones.has(t)).length;
    if (sinMotivo > 0) emitir(4, feature, `${sinMotivo} cancelada(s) sin motivo`);

    // Pista 4, forma b: hecha sin ejecución válida, solo si la feature tiene alguna ejecución.
    if (f.ejecuciones > 0) {
      const hechas = tareas.filter((t) => f.estados.get(t).has("hecha"));
      const sinEjecucion = hechas.filter((t) => !f.ejecutadas.has(t)).length;
      if (sinEjecucion > 0) emitir(4, feature, `${sinEjecucion} hecha(s) sin ejecución válida`);
    }

    // Pista 5: dos o más bloqueos de alcance o especificación.
    const alcance = f.bloqueos.filter((t) => TIPOS_ALCANCE.includes(t)).length;
    if (alcance >= 2) emitir(5, feature, `${alcance} bloqueos de alcance o especificación`);
  }

  // Pista 6 (global, feature null): participación de planificador y arquitecto en el total del consumo.
  // Por costo si consumo.costo no es null; si no, por turnos.
  if (consumo) {
    const peso = (fila) => (consumo.costo === null ? fila.turnos : (fila.costo ?? 0));
    const total = consumo.filas.reduce((suma, fila) => suma + peso(fila), 0);
    const definir = consumo.filas.filter((fila) => ROLES_DEFINIR.includes(fila.rol)).reduce((suma, fila) => suma + peso(fila), 0);
    if (total > 0 && definir / total > UMBRAL_DEFINIR) {
      emitir(6, null, `arquitecto+planificador = ${Math.round((definir * 100) / total)} % del total`);
    }
  }

  return pistas.sort((a, b) => (a.n !== b.n ? a.n - b.n : a.feature < b.feature ? -1 : a.feature > b.feature ? 1 : 0));
}
