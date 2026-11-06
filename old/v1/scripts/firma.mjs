// Firma estable del primer rechazo de validar-tarea (F38, task-03). Función pura: no lee ni escribe archivos.
//
// reglaDe(motivo) clasifica un motivo en una regla con nombre fijo (tabla ordenada; gana la primera que casa).
// firma({ motivo, ruta, texto }) devuelve «Firma: <regla>|<ruta>|<hash>», donde <hash> son los 12 primeros
// caracteres hexadecimales del SHA-256 del contenido exacto (`texto`, tal cual se leyó).

import { createHash } from "node:crypto";

// Orden importa: la primera regla que casa con el motivo es la que cuenta.
const REGLAS = [
  ["bloque-abierto", /bloque de código abierto/],
  ["secciones", /Las secciones «##»|Falta la sección/],
  ["cabecera", /La primera línea|La segunda línea/],
  ["tamano", /caracteres/],
  ["evidencia-falta", /Falta la salida|Falta la línea «exit|está vacía|no aparece literal/],
  ["registro", /Registro/],
  ["bloqueo", /Bloqueo/],
  ["fuente", /Fuente/],
  ["estado", /no está terminada/],
];

export function reglaDe(motivo) {
  const texto = String(motivo);
  for (const [regla, patron] of REGLAS) {
    if (patron.test(texto)) return regla;
  }
  return "otra";
}

export function digestFirma(texto) {
  return createHash("sha256").update(String(texto), "utf8").digest("hex").slice(0, 12);
}

export function firma({ motivo, ruta, texto }) {
  const hash = digestFirma(texto);
  return `Firma: ${reglaDe(motivo)}|${ruta}|${hash}`;
}
