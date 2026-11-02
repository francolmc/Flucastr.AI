// Manifiesto de frases del contrato de roles: dónde debe estar cada frase.
// FRASES_POR_ARCHIVO es { 'agentes/<nombre>' | 'skills/<nombre>': [frases] }. contrato-roles.mjs exige cada frase en su archivo.
// Para mover una frase, se edita solo esta lista.

// Frases de F21 (tareas 01 a 03) que el agente «coordinador» debe conservar, para Pi y Claude Code.
export const FRASES_COORDINADOR_F21 = [
  'Lectura de tareas: con `Read` y `limit: 3` lees solo las 3 primeras líneas',
  'No lees `definitions/` salvo `STATUS.md` y `BACKLOG.md`',
  'No lees tareas `hecha`',
  'Tarea completa solo en la revisión del modo yolo',
  'una sola vez por transición',
  'Agrupa en un mismo turno las llamadas independientes',
  'actívala una vez por sesión; si `subagent` ya funcionó, no la repitas',
  'Plantilla de encargo',
  'no uses `contact_supervisor` para preguntar: ante falta de información responde `BLOQUEO:` o `REFINAR:`',
];

// Frases de F22 (tareas 01 a 03) de lectura acotada. Las claves planificador, constructor y arquitecto son agentes; el resto, skills.
export const FRASES_LECTURA_F22 = {
  planificador: [
    'Solo lees de `definitions/` la sección que toca la feature',
    'No lees tareas de otras features ni tareas `hecha`',
  ],
  constructor: [
    'De `depende_de:` lees solo las *Notas* de esa tarea',
    'No lees tareas `hecha` ajenas a `depende_de:`',
  ],
  arquitecto: [
    'una vez por sesión',
    'No lees `features/` ni tareas',
  ],
  'descomponer-feature': [
    'cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita',
    'con su ruta y título',
    '~3 archivos tocados',
  ],
  'ejecutar-tarea': [
    'de `depende_de:` lee solo las *Notas* de esa tarea',
    'hasta 1,5 KB',
  ],
  'disenar-arquitectura': [
    'Lee cada entrada una vez',
  ],
};

// Frases de F27 (tareas 01 a 03) de una sola pasada. La clave arquitecto es agente; el resto, skills.
export const FRASES_UNA_PASADA = {
  arquitecto: [
    'Una sola pasada por puerta',
    'devuelves el documento y nada más',
    'no reabres preguntas ni propones otra ronda',
    'Otra ronda solo si Franco la pide',
    'Decisiones para Franco',
    'Tope de tamaño: 12288 bytes',
    'Tamaño de la pasada: <n> bytes',
  ],
  'definir-proyecto': [
    'devuelves el documento y nada más',
    'Decisiones para Franco',
    'Tope de tamaño: 12288 bytes',
  ],
  'disenar-arquitectura': [
    'devuelves el documento y nada más',
    'Decisiones para Franco',
    'Tope de tamaño: 12288 bytes',
  ],
  'revisar-proyecto-existente': [
    'devuelves el documento y nada más',
    'Decisiones para Franco',
    'Tope de tamaño: 12288 bytes',
  ],
};

export const FRASES_POR_ARCHIVO = {
  'agentes/arquitecto': [
    ...FRASES_LECTURA_F22.arquitecto,
    ...FRASES_UNA_PASADA.arquitecto,
  ],
  'agentes/planificador': [
    'escribes en `STATUS.md`',
    'REFINAR: feature=Fxx; preguntas=<n>',
    'Modo yolo: activo',
    'features/completed/',
    ...FRASES_LECTURA_F22.planificador,
  ],
  'agentes/constructor': [
    'escribes en `STATUS.md`',
    ...FRASES_LECTURA_F22.constructor,
  ],
  'agentes/coordinador': [
    ...FRASES_COORDINADOR_F21,
    'REFINAR: feature=Fxx; preguntas=<n>',
    'features/completed/',
    'registro/',
    'lista cerrada',
    'pedido explícito',
    'git diff scripts/',
    'PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>',
    'Al delegar, carga `control-consumo`',
    'al pedirte Franco un comando',
  ],
  'skills/comandos-coordinador': [
    'cierra la rama, haz el PR y despliega',
    'node scripts/archivar.mjs --aplicar Fxx',
    'node scripts/registrar.mjs',
    'no autoriza',
    '--presupuesto',
  ],
  'skills/ramas-feature': [
    'Rama: <prefijo>/Fxx-nombre',
    'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>',
    'Franco confirmó `git switch <rama>`',
  ],
  'skills/control-consumo': [
    'Una escritura por transición: un solo `Write` con el archivo completo',
    'cada ítem ≤150 caracteres',
    'Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>',
    'estado=excedido',
    'ampliado=N',
    'abre sesión nueva',
  ],
  'skills/modo-yolo': [
    'Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>',
    'ADVERTENCIA: rama main',
    'Modo yolo: detenido (feature Fxx requiere refinado)',
    'Modo yolo: terminado',
  ],
  'skills/descomponer-feature': [
    'solo puedes mover la marca',
    'REFINAR: feature=Fxx; preguntas=<n>',
    'features/Fxx-nombre/refinado.md',
    'Modo yolo: activo',
    ...FRASES_LECTURA_F22['descomponer-feature'],
  ],
  'skills/ejecutar-tarea': [
    ...FRASES_LECTURA_F22['ejecutar-tarea'],
  ],
  'skills/disenar-arquitectura': [
    ...FRASES_LECTURA_F22['disenar-arquitectura'],
    ...FRASES_UNA_PASADA['disenar-arquitectura'],
  ],
  'skills/definir-proyecto': [
    ...FRASES_UNA_PASADA['definir-proyecto'],
  ],
  'skills/revisar-proyecto-existente': [
    ...FRASES_UNA_PASADA['revisar-proyecto-existente'],
  ],
};
