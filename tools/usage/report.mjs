export function crearFormateadores({ columnas, columnasSesiones }) {
  // Tabla de texto alineada: primera fila = encabezados.
  function tabla(columnas, filas) {
    const celdas = [columnas, ...filas.map((f) => columnas.map((c) => String(f[c])))];
    const anchos = columnas.map((_, i) => Math.max(...celdas.map((r) => r[i].length)));
    return celdas.map((r) => r.map((v, i) => v.padEnd(anchos[i])).join("  ").trimEnd());
  }

  function imprimirSesiones(sesiones, avisos, desde) {
    if (sesiones.length === 0) {
      console.log(`sin sesiones desde ${desde}`);
    } else {
      const celdas = sesiones.map((s) => ({
        ...s, contexto_mediana: s.contexto_mediana ?? "-", contexto_max: s.contexto_max ?? "-",
        creditos: s.creditos ?? "-", sondeos: s.sondeos ?? "-",
      }));
      for (const linea of tabla(columnasSesiones, celdas)) console.log(linea);
    }
    for (const a of avisos) console.log(`aviso: ${a}`);
  }

  function imprimirTexto(filas, cuota, avisos, desde) {
    if (filas.length === 0) {
      console.log(`sin sesiones desde ${desde}`);
    } else {
      for (const linea of tabla(columnas, filas)) console.log(linea);
    }
    if (cuota.length > 0) {
      console.log("");
      console.log("cuota semanal de Codex (puntos = % de la cuota secundaria; solo sesiones exclusivas)");
      for (const linea of tabla(["modelo", "puntos", "tokens", "sesiones"], cuota)) console.log(linea);
    }
    for (const a of avisos) console.log(`aviso: ${a}`);
  }

  return { imprimirSesiones, imprimirTexto };
}
