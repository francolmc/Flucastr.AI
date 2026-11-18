---
estado: listo
rama: feature/idioma-adaptable
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
tramo: 14
---
# Idioma adaptable

## Objetivo
Traducir y optimizar las instrucciones operativas al inglés, conservar la documentación en español y adaptar la interacción al idioma de cada persona.

## Exploración
- El repositorio declara `main` como base. Sus dos agentes, siete skills y prompts incluyen instrucciones en español; hay contratos de planes y señales consumidos por programas que deben conservarse.
- Los comandos públicos tienen opciones españolas; las pruebas de `tools/verify/` verifican frases literales y sus casos negativos deben seguir siendo sensibles tras la traducción.
- Se descartó detectar el idioma del sistema: la persona usuaria eligió mensajes de comandos en español y agentes adaptables al idioma de la conversación. `evals/prompt-language.md` no demuestra mejoras de calidad por idioma.
- La instalación remota debe seguir funcionando cuando su archivo se descarga de forma independiente, sin asumir que el repositorio ya está presente.
- El [inventario preliminar](exploracion.md) reúne 445 archivos versionados de texto con posibles referencias, incluidas fuentes históricas y JSONL; hay coincidencias permitidas y falsos positivos. Excluye credenciales y archivos temporales. La anonimización debe conservar enlaces, estructura de datos y sentido de la evidencia; el propio inventario debe anonimizarse al final.
- `./verify` terminó con `VERIFY OK` en la línea base; su propio encabezado indica que no requiere Docker. El repositorio tiene un remoto `origin`; antes de delegar debe comprobarse que `main` esté limpia y actualizada.
- `scripts/resolver.mjs` expone subcomandos españoles internos; se conservan para no romper sus consumidores.

## Evaluación
Se recomienda traducir las instrucciones y añadir comandos y opciones en inglés, sin retirar las interfaces actuales. Conserva instalaciones y automatizaciones existentes y evita introducir un sistema de localización que la persona usuaria ya no necesita.

## Supuestos
- Las claves, rutas, banderas, estados y formatos de máquina existentes se conservan; si se desea cambiarlos, hará falta definir una migración compatible.

## Decisiones ya tomadas
- Ejecutor: constructor, por el tamaño y las múltiples etapas.

## Decisiones

- Resuelto: conservar como excepción las referencias integradas en contratos ejecutables y citas históricas exactas; documentar ruta y motivo, y anonimizar las demás referencias dentro del alcance. La persona usuaria aprobó la propuesta de terminación y su ejecución continua.

## Validación
La persona usuaria confirmó instrucciones en inglés, mensajes de comandos y documentación en español, adaptación de los agentes a cada persona y nombres y opciones ingleses con alias compatibles.
También aceptó conservar la atribución legal y anonimizar los archivos históricos del repositorio, sin reescribir el historial Git.

## Alcance
Agentes, skills, contratos operativos, prompts internos y nombres y opciones de comandos, documentación y referencias históricas, incluidas rutas y datos de pruebas. Se preservarán pruebas de aceptación y contratos existentes. Se excluyen credenciales, archivos temporales, cambios al historial Git y la atribución de copyright de `LICENSE`; las URLs funcionales del repositorio se conservan.

## Verificación
`./verify` — verificación final; las comprobaciones específicas de idioma se detallarán en las historias.

## Diseño y contratos

- Los mensajes de programas siguen en español; los agentes contestan en el idioma elegido por cada persona, que puede cambiar durante la conversación. Las instrucciones internas van en inglés sin traducir identificadores, nombres de skills instaladas, campos del plan, señales de retorno ni esquemas de máquina.
- En las opciones públicas, los pares inglés/español son: `--dry-run`/`--simular`, `--migrate`/`--migrar`, `--copy`/`--copiar`, `--only`/`--solo`, `--project`/`--proyecto`, `--agent`/`--agente`, `--project-skills`/`--skills-proyecto`, `--quiet`/`--silencioso`, `--all`/`--todo`, `--keep-settings`/`--conservar-ajustes`, `--status`/`--estado`, `--update`/`--actualizar`, `--show-urls`/`--mostrar-urls`, `--since`/`--desde`, `--tool`/`--herramienta`, `--sessions`/`--sesiones`, `--threshold`/`--umbral`, `--rates`/`--tarifas`, `--data`/`--datos`, `--root`/`--raiz`; `report` equivale a `informe`. Se conservan opciones ya inglesas y se aceptan combinaciones entre idiomas.
- Los puntos públicos en inglés serán `install.sh`, `uninstall.sh`, `install-remote.sh`, `scripts/usage.mjs` y `scripts/observe.mjs`; preservan argumentos y código de salida. La entrada remota inglesa debe funcionar por sí sola al descargarse, y la española seguirá admitiendo el mismo uso. `scripts/kit-run.mjs` ya tiene nombre inglés. Los subcomandos internos de `scripts/resolver.mjs` se conservan.
- En archivos históricos sustituir los nombres identificables por seudónimos coherentes y diferenciados, mantener cifras y cronología, y señalar que los nombres se anonimizaron. Renombrar rutas identificables y actualizar sus enlaces; conservar únicamente atribución de `LICENSE` y las URL operativas que identifican este repositorio. No tocar `.env`, credenciales ni `pruebas/.temporales/`.

## Pasos

1. [Instrucciones adaptables para agentes y skills](tramo-1.md): traducir las instrucciones y adaptar sus pruebas negativas, preservando contratos.
2. [Prompts de ejecución y revisión](tramo-2.md): conservar JSON, veredictos y reintentos.
3. [Instalación con nombres ingleses](tramo-3.md): añadir entrada y opciones inglesas con pruebas de equivalencia y salida española.
4. [Desinstalación](tramo-4.md).
5. [Instalación remota](tramo-5.md).
6. [Medidor de uso](tramo-6.md).
7. [Observador](tramo-7.md).
8. [Ejecución de planes](tramo-8.md).
9. [Código histórico, primer grupo](tramo-9.md).
10. [Código histórico, segundo grupo](tramo-10.md).
11. [Reportes históricos](tramo-11.md).
12. [Datos de ejemplo](tramo-12.md).
13. [Documentación y referencias históricas](tramo-13.md).
14. [Auditoría y verificación final](tramo-14.md).

## Evidencia
- Tramo 14, paso 2 (A14): `git diff --check` sobre el árbol de trabajo y `git diff --cached --check` terminaron sin salida.
  ```
  $ git diff --check
  exit 0
  $ git diff --cached --check
  exit 0
  ```
- Tramo 14, paso 2 (A14): `./verify` desde la raíz terminó con `VERIFY OK`. Cola de la salida real:
  ```
  $ ./verify
  kit-run: 24 casos pasaron
  ok 13: pruebas de kit run pasaron con los CLIs simulados
  == 8r. observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom ==
  ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)
  ok 8r idioma: informes, mezcla, errores y mutación de alias equivalentes con datos aislados
  ok 8r negativa: la copia sin oom no muestra OOM
  ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
  == 8t. small change: definición, riesgo y prácticas por tecnología ==
  ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
  VERIFY OK
  exit 0
  ```
  Resumen: 165 líneas `ok`; todos los `ℹ fail 0`. Limitación conocida, no nueva: `AVISO 10: falta pruebas/comparar-openspec/ (pruebas/ está en .gitignore); paso omitido`.
- Tramo 14, paso 1 (A14): búsqueda final de referencias personales y de proyectos del inventario sobre `git ls-files -co --exclude-standard`, excluyendo `old/v1/`, `LICENSE`, `pruebas/.temporales/` y `excepciones.md`, con `grep -I -n -w -i -E`. Resultado: 60 coincidencias en 36 archivos. Se cotejó cada una con `excepciones.md`: 58 están listadas por ruta y motivo (contratos ejecutables, citas históricas exactas, URL funcionales, rutas históricas y falsos positivos «burocracia»); las 2 restantes son citas dentro de `cambios/idioma-adaptable/tramo-13.md` que referencian excepciones ya listadas (`plan.md` `rol=franco` y el registro de `anonimizacion.md`). Número de línea de `plan.md`: la excepción `rol=franco` figura ahora en la línea 84 (el registro decía 82; mismo contenido). Ninguna coincidencia sin excepción. `exploracion.md` solo aparece en su línea 129 (ruta histórica), exceptuada. Enlaces relativos de Markdown fuera de `old/v1/`: 192 comprobados, 0 rotos. Dentro de `old/v1/` (fuera de alcance por decisión de la persona usuaria): 25 enlaces, 6 rotos, sin reparar. `anonimizacion.md:25` no se modificó. exit 0.
- Avance del tramo 13: `./verify` terminó con `VERIFY OK`, exit 0; `git diff --check` pasó y las frases del manifiesto histórico de los tres archivos modificados están presentes.
- Revisión independiente del tramo 3: `./verify` terminó con `VERIFY OK`, exit 0; equivalencia de instalación, migración, errores y simulación comprobada.
- Revisión independiente del tramo 2: `./verify` terminó con `VERIFY OK`, exit 0; 21 casos de kit run pasaron.
- Revisión independiente del tramo 1: `./verify` finalizó con `VERIFY OK`, exit 0; la autoprueba offline OpenSpec sigue omitida por ausencia de su carpeta.
- Tramo 1: `./verify` terminó con `VERIFY OK` y exit 0; las comprobaciones negativas de los contratos pasaron. La autoprueba offline OpenSpec se omitió por falta de su carpeta, como documenta el proyecto.

## Notas

- Revisión tramo 13: A13 cumplido con old/v1/ fuera de alcance por decisión de la persona usuaria; búsqueda final solo devuelve rutas listadas en excepciones.md; `git diff --check` exit 0; `./verify` independiente: VERIFY OK. Pendiente de decisión: `cambios/hechos/estructura-repo/anonimizacion.md:25` conserva nombres originales como registro histórico. Veredicto: APROBADO. Se habilita el tramo 14.
- Tramo 13, avance: se anonimizaron textos adicionales del coordinador, sus skills y F42; se restauraron cinco frases exigidas por el manifiesto histórico y se comprobaron las frases de los tres archivos modificados. La suite histórica completa de roles registra 130 casos aprobados y uno no ejecutable porque la v1 archivada ya no tiene `old/v1/agentes`; no se atribuye a los cambios. Falta clasificar el inventario restante y completar la auditoría del tramo 14.
- Revisión tramo 12: A12 cumplido; diff conserva campos, cifras, fechas y relaciones, y el informe productivo coincide con el resultado esperado, incluidos OOM y solape. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 13.
- Revisión tramo 11: A11 cumplido para el contenido de los tres informes; cifras y sustituciones comprobadas contra HEAD, sin identificadores buscados restantes. Los nombres de archivo y sus enlaces se resolverán en el tramo 13 según el handoff. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 12.
- Revisión tramo 10: A10 cumplido para textos visibles; se conservan identificadores históricos del contrato de eventos, incluida la indicación `rol=franco`. Las 52 pruebas focalizadas pasaron; se registran fallos de pruebas antiguas ampliadas ajenas al cambio. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 11.
- Revisión tramo 9: A9 cumplido; entradas genéricas conectadas a los validadores históricos, contratos y pruebas anteriores preservados. Pruebas históricas: 80 aprobadas; ./verify independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 10.
- Revisión tramo 8: A8 cumplido; alias y mezclas equivalentes, errores y raíz con espacios comprobados con ejecutores simulados; prueba negativa sensible. `./verify` independiente: VERIFY OK, exit 0; 24 casos de kit run. Veredicto: APROBADO. Se habilita el tramo 9.
- Revisión tramo 7: A7 cumplido; entrada, alias, errores e informes equivalentes con fixture aislado; ciclo vecino con Docker simulado pasó. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 8.
- Revisión tramo 6: A6 cumplido; entrada y alias ingleses conservan resultados, errores y JSON sobre datos aislados; 20 pruebas pasaron. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 7.
- Revisión tramo 5: A5 cumplido; entradas autónomas sincronizadas, equivalencia y errores comprobados sin red. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 6.
- Revisión tramo 4: A4 cumplido; alias, envoltorio y pruebas conservan los contratos. `./verify` independiente: VERIFY OK, exit 0. Veredicto: APROBADO. Se habilita el tramo 5.
- Revisión tramo 3: A3 cumplido; alias, punto de entrada y pruebas de equivalencia conservan los contratos. Veredicto: APROBADO. Se habilita el tramo 4.
- Tramo 3 implementado: alias y entrada inglesa, equivalencia en instalaciones temporales y `./verify` en verde; pendiente revisión independiente en contexto nuevo.
- Revisión tramo 2: A2 cumplido; prompts, esquema, reintentos, datos y mensajes conservados, con prueba negativa sensible. Veredicto: APROBADO. Se habilita el tramo 3.
- Revisión tramo 1: A1 cumplido según diff, compatibilidad y pruebas negativas; agentes y skills conservan los marcadores de protocolo y declaran adaptación lingüística. Veredicto: APROBADO. Se habilita el tramo 2.
- Tramo 1 completado tras reanudar: instrucciones y copias sincronizadas; pruebas literales y sus mutaciones negativas adaptadas. Pendiente revisión en contexto nuevo antes del tramo 2; usar `/compact` o una sesión nueva con este plan.
- La persona usuaria autorizó que el principal continúe y sincronice todas las copias de compatibilidad necesarias del tramo 1.
- Revisor: los avisos sobre rutas de carpetas en los tramos 9, 10 y 13 corresponden a conjuntos que determina el inventario; el aviso de capas en el tramo 7 se refiere a un único comando y sus fixtures. No hay aviso residual que cambie el alcance.
- Tramo 1 parcial: las pruebas negativas de `tools/verify/agent-contracts.sh` y las pruebas focalizadas del contrato pasaron. Tras aprobar la sincronización de `nucleo/contrato/verificacion.md`, la comprobación de compatibilidad avanzó y falló en el siguiente par: `core/agents/constructor.md` y `agentes/constructor.md`. Se requiere revisar o ampliar el alcance para las copias restantes antes de completar el TODO de sincronización y ejecutar `./verify`.
- Retoma: `core/contracts/verificacion.md` y `nucleo/contrato/verificacion.md` son idénticos (`cmp`, exit 0; `git diff --check`, exit 0). No se reintentó `./verify` tras detectar que también hay otras copias de compatibilidad desactualizadas.
- PAUSA del tramo 13 (2026-11-18): la búsqueda de referencias a proyectos externos encontró 40 archivos versionados fuera de `old/v1/` (patrones con prefijo de proyecto y nombres de proyecto del inventario) y 7 archivos sin seguimiento, con unas 250 líneas de coincidencias sin clasificar. A13 exige cero referencias no exceptuadas de proyectos externos, pero la propuesta de terminación pide actualizar A13 y A14 y convertir los grupos en pasos con pruebas y duración medida antes de ejecutar; el constructor no puede modificar la aceptación. Además, algunas coincidencias están en JSONL de evidencia (`docs/investigaciones/auditoria-verificacion-general/builds-2026-11-13.jsonl`) y en fixtures de pruebas, donde el cambio exige revisión campo por campo. Nada nuevo se marcó como hecho en esta ejecución; `excepciones.md` no se modificó. Retomar tras la revisión del principal.
