import { fallar } from "../../tools/resolver/errors.mjs";

export function generarAgenteMarkdown({
  archivo,
  agente,
  herramienta,
  cabecera,
  cuerpo,
  ventana,
  resolverModelo,
  resolverEsfuerzo,
  lineaIdentidad,
  adaptarCabeceraPi,
}) {
  const nombre = cabecera.match(/^name:\s*(.+?)\s*$/m)?.[1];
  if (nombre !== agente) {
    fallar(`el 'name' del encabezado ('${nombre}') debe coincidir con el archivo ('${agente}')`);
  }
  if (/^model:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'model': se define en models.json`);
  }
  if (/^effort:/m.test(cabecera) || /^thinking:/m.test(cabecera)) {
    fallar(`${archivo} no debe declarar 'effort' ni 'thinking': el esfuerzo se define en models.json`);
  }

  const modelo = resolverModelo(agente, herramienta);
  const esfuerzo = resolverEsfuerzo(agente);
  // Claude Code lleva 'effort'; Pi lleva 'thinking'. Sin esfuerzo no se escribe ninguna de las dos.
  const lineaEsfuerzo = !esfuerzo ? "" : herramienta === "pi" ? `thinking: ${esfuerzo}\n` : `effort: ${esfuerzo}\n`;
  // autoCompactWindow solo en Claude Code y solo si viene una ventana (el agente es menor que el planner).
  const lineaVentana = ventana === undefined || herramienta === "pi" ? "" : `autoCompactWindow: ${ventana}\n`;
  const cabeceraSalida = herramienta === "pi" ? adaptarCabeceraPi(cabecera) : cabecera;
  return `---\n${cabeceraSalida}\n${lineaEsfuerzo}${lineaVentana}model: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con install.sh\n---\n${lineaIdentidad(herramienta, agente)}\n${cuerpo}`;
}
