# Propuesta de estructura

## Estructura destino propuesta
El usuario pidió considerar nombres en inglés y un `core/` explícito. `nucleo/` ya existe y contiene contrato y recetas; la propuesta lo integra en `core/`, no crea un núcleo vacío paralelo. Los nombres en inglés son la organización destino; las rutas heredadas se conservan cuando forman parte de contratos existentes.
```
README.md                        # mapa breve de la estructura
instalar.sh, desinstalar.sh, verify # entradas públicas existentes; nombres ingleses son una opción futura
core/
  agents/                        # instrucciones comunes de agentes
  skills/                        # capacidades y recursos comunes
  templates/                     # plantillas compartidas existentes
  contracts/                     # contratos, incluida verificación
  recipes/                       # instrucciones por tecnología
adapters/
  claude-code/                   # formatos, lanzadores y permisos específicos
  codex/
  pi/
tools/
  install/                       # componentes del instalador
  verify/                        # fases y utilidades de verificación
  resolver/                      # configuración y resolución compartida
  run/                           # ejecución de planes
  usage/                         # medición de uso
evals/                           # índice y protocolo; arneses existentes conservan su ruta
tests/                           # aceptación y catálogo; otras suites conservan su ruta
docs/decisions/                  # decisiones de estructura y compatibilidad
changes/                         # HISTORY.md indexa planes históricos existentes
archive/                         # índice de old/ conservado en su ruta
```
`modelos.json`, `instalar-remoto.sh`, `instalar.sh`, `desinstalar.sh`, `verify`, `scripts/`, `agentes/`, `skills/`, `nucleo/`, `pruebas/`, `cambios/` y rutas que consumen instalaciones existentes requieren inventario y estrategia explícita: compatibilidad temporal mediante entradas o enlaces donde sea viable, sin duplicar la fuente de verdad. No cambiar nombres internos de skills, comandos, opciones, formatos ni contratos externos por deducción; una ruta de archivo en inglés no implica traducir su contenido. Las rutas del archivo histórico deben seguir siendo consultables sin editar sus contenidos. Mantener `old/v1/` que genera la migración en proyectos como contrato independiente.


La compatibilidad con el tar remoto y las rutas instaladas exige copias regulares generadas y verificadas, no enlaces simbólicos en el paquete: ver [compatibilidad-pendiente.md](compatibilidad-pendiente.md). `old/` y `cambios/hechos/` permanecen accesibles; `changes/HISTORY.md` será inicialmente un índice, no prueba de traslado completo.
