// Validador determinista de que el árbol de «## Estructura» del README coincide con agentes/ y skills/.
// validarReadme({ readme, agentes, skills }) devuelve un arreglo de mensajes de error en español; vacío = válido. No lanza.
// readme: texto de README.md. agentes: nombres de archivo de agentes/ (['arquitecto.md', …]).
// skills: nombres de carpeta de skills/ (['crear-backlog', …]). El módulo no lee el disco.

const RE_HIJO = /^│   [├└]── (\S+)/;

// Devuelve las líneas del primer bloque de código que aparece después de «## Estructura», o null.
function bloqueEstructura(readme) {
  const lineas = String(readme).replace(/\r\n?/g, '\n').split('\n');
  const i = lineas.findIndex((l) => l.trimEnd() === '## Estructura');
  if (i < 0) return null;
  const a = lineas.findIndex((l, j) => j > i && l.startsWith('```'));
  if (a < 0) return null;
  const b = lineas.findIndex((l, j) => j > a && l.startsWith('```'));
  if (b < 0) return null;
  return lineas.slice(a + 1, b);
}

// Hijos de una carpeta del árbol: líneas consecutivas tras «├── carpeta/» que empiezan por «│   ».
function hijosDe(lineas, carpeta) {
  const i = lineas.findIndex((l) => l.startsWith(`├── ${carpeta}/`) || l.startsWith(`└── ${carpeta}/`));
  if (i < 0) return [];
  const hijos = [];
  for (let j = i + 1; j < lineas.length; j++) {
    if (!lineas[j].startsWith('│   ')) break;
    const m = RE_HIJO.exec(lineas[j]);
    if (m) hijos.push(m[1]);
  }
  return hijos;
}

export function validarReadme({ readme, agentes, skills }) {
  const lineas = bloqueEstructura(readme);

  // Regla 1: el README tiene la sección «## Estructura» con su bloque de código.
  if (lineas === null) {
    return ['El README no tiene el bloque de código de «## Estructura».'];
  }

  const errores = [];
  const hijosAgentes = hijosDe(lineas, 'agentes');
  const hijosSkills = hijosDe(lineas, 'skills').map((h) => h.replace(/\/$/, ''));

  // Regla 2: cada archivo de agentes/ figura en el árbol.
  for (const a of agentes) {
    if (!hijosAgentes.includes(a)) {
      errores.push(`El agente «${a}» existe en agentes/ pero no figura en el árbol de «## Estructura» del README.`);
    }
  }

  // Regla 3: cada carpeta de skills/ figura en el árbol, con / final.
  for (const s of skills) {
    if (!hijosSkills.includes(s)) {
      errores.push(`La skill «${s}» existe en skills/ pero no figura en el árbol de «## Estructura» del README (como «${s}/»).`);
    }
  }

  // Regla 4: ningún hijo del árbol de agentes/ o skills/ falta en disco.
  for (const h of hijosAgentes) {
    if (!agentes.includes(h)) {
      errores.push(`El README lista el agente «${h}» en el árbol de agentes/, pero no existe en agentes/.`);
    }
  }
  for (const h of hijosSkills) {
    if (!skills.includes(h)) {
      errores.push(`El README lista la skill «${h}» en el árbol de skills/, pero no existe en skills/.`);
    }
  }

  return errores;
}
