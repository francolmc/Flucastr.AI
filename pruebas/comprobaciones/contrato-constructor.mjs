// Validador determinista del contrato del constructor: agentes/constructor.md y skills/ejecutar-tarea/SKILL.md.
// validarConstructor({ constructor, skill }) devuelve un arreglo de mensajes de error en español, uno por regla incumplida; vacío = válido.
// constructor y skill son los textos de esos dos archivos. No lanza excepciones.

const ARCHIVO = {
  constructor: 'agentes/constructor.md',
  skill: 'skills/ejecutar-tarea/SKILL.md',
};

// Cada regla exige frases literales (sin formato) en el texto indicado.
const REGLAS = [
  { n: 1, sobre: 'constructor', frases: ['estado: aprobada', 'te detienes'] },
  { n: 2, sobre: 'constructor', frases: ['Nunca escribes `hecha`'] },
  { n: 3, sobre: 'constructor', frases: ['No haces commit, push, PR, merge ni despliegue'] },
  { n: 4, sobre: 'constructor', frases: ['escribes en `STATUS.md`'] },
  { n: 5, sobre: 'skill', frases: ['no es `aprobada`', 'detente', 'Cambia `estado` a `en curso`'], despuesDe: ['no es `aprobada`', 'Cambia `estado` a `en curso`'] },
  { n: 6, sobre: 'skill', frases: ['Falta de credenciales o acceso', 'Una decisión que cambia el alcance', 'La misma verificación falla dos veces por la misma causa'] },
  { n: 7, sobre: 'skill', frases: ['estado: bloqueada'] },
  { n: 8, sobre: 'skill', frases: ['rol=planificador', 'rol=arquitecto'], regex: /BLOQUEO: rol=<[^>]+>; motivo=<[^>]+>/ },
  { n: 9, sobre: 'skill', frases: ['Nunca `hecha`', 'Sin commit, push, PR, merge ni despliegue'] },
  { n: 10, sobre: 'constructor', frases: ['git switch -c', 'git branch --show-current', 'Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`'] },
  { n: 11, sobre: 'skill', frases: ['git switch -c', 'git branch --show-current', 'Rama:', 'Franco confirmó `git switch <rama>`', 'Cambia `estado` a `en curso`'], despuesDe: ['git switch -c', 'Cambia `estado` a `en curso`'] },
  { n: 12, sobre: 'skill', frases: ['CONFIRMAR: accion=git switch <rama>; motivo=<motivo>'], regex: /CONFIRMAR: accion=git switch <[^>]+>; motivo=[^\n]+/, mensajeRegex: 'falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>»' },
];

export function validarConstructor({ constructor, skill } = {}) {
  const textos = {
    constructor: String(constructor ?? ''),
    skill: String(skill ?? ''),
  };
  const errores = [];

  for (const regla of REGLAS) {
    const texto = textos[regla.sobre];
    const problemas = [];

    const faltan = regla.frases.filter((frase) => !texto.includes(frase));
    if (faltan.length) {
      problemas.push(`faltan las frases ${faltan.map((f) => `«${f}»`).join(', ')}`);
    }

    if (regla.regex && !regla.regex.test(texto)) {
      problemas.push(regla.mensajeRegex ?? 'falta la línea «BLOQUEO: rol=<rol requerido>; motivo=<motivo>»');
    }

    if (regla.despuesDe) {
      const [primera, segunda] = regla.despuesDe;
      const i = texto.indexOf(primera);
      const j = texto.indexOf(segunda);
      if (i !== -1 && j !== -1 && j < i) {
        problemas.push(`«${segunda}» debe aparecer después de «${primera}»`);
      }
    }

    if (problemas.length) {
      errores.push(`Regla ${regla.n} (${ARCHIVO[regla.sobre]}): ${problemas.join('; ')}.`);
    }
  }

  return errores;
}
