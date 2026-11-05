// Comprueba la viñeta «- Fuente:» de la sección «## Contexto» de una tarea (definitions/CONTRATOS.md §2; task-10 de F28).
// Opción --fuente de scripts/validar-tarea.mjs; no forma parte de la regla de formato-tarea.mjs.
// validarFuente(texto, leer) devuelve motivos en español; vacío = válida.
// leer(ruta) devuelve el texto del archivo o null si no se puede leer. Función pura: no toca el disco ni git.

import { secciones } from './formato-tarea.mjs';

const RE_FUENTE = /^- Fuente: (ninguna|(\S+) «([^»]+)»)$/;

export function validarFuente(texto, leer) {
  const todo = String(texto).replace(/\r\n?/g, '\n');
  const contexto = secciones(todo.split('\n')).find((s) => s.titulo === 'Contexto');
  const vinetas = (contexto?.lineas ?? []).filter((l) => l.startsWith('- Fuente:'));

  if (vinetas.length === 0) return ['Falta la viñeta «- Fuente:» en «## Contexto».'];
  if (vinetas.length > 1) return ['Hay más de una viñeta «- Fuente:» en «## Contexto».'];

  const coincide = RE_FUENTE.exec(vinetas[0]);
  if (!coincide) {
    return ['La viñeta «- Fuente:» tiene formato inválido: debe ser «ninguna» o «<ruta> «<encabezado>»», una viñeta por documento y sin comillas invertidas en la ruta.'];
  }
  if (coincide[1] === 'ninguna') return [];

  const ruta = coincide[2];
  const encabezado = coincide[3];
  const contenido = leer(ruta);
  if (contenido === null || contenido === undefined) {
    return [`El archivo de la fuente no se puede leer: ${ruta}.`];
  }

  const existe = String(contenido)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .some((l) => l.startsWith('#') && l.replace(/^#+\s*/, '').includes(encabezado));
  return existe ? [] : [`El encabezado «${encabezado}» no existe en ${ruta}.`];
}
