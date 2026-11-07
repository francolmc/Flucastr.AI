---
estado: listo
rama: docs/help-instalador
base: main
repos: [.]
ejecutor: constructor
---
# Ayuda completa del instalador

## Objetivo
Que `bash instalar.sh --help` permita elegir cómo instalar o migrar sin tener que leer el script, con todas las opciones reales, restricciones y ejemplos.

## Supuestos
- El pedido se limita a mejorar la ayuda, su descubrimiento en README y sus pruebas; si Franco quiere nuevas opciones, cambia el alcance.
- Se conserva el procesamiento actual de argumentos, incluido su orden; si se quiere que help prevalezca sobre argumentos inválidos anteriores, requiere otra decisión.

## Alcance
`instalar.sh` (cabecera y ayuda), `README.md` (Instalación), `verify` (pruebas de ayuda), `AGENTS.md` (solo declarar `Rama base: main`) y este plan.
Fuera de alcance: cambiar instalación, migración, validación de argumentos, modelos, agentes, skills o desinstalación.

## Decisiones ya tomadas
- Ayuda estática mediante una función y heredoc, invocada por `-h | --help`; no extraer líneas de comentarios por número.
- Secciones: Uso, Opciones, Restricciones, Entorno y rutas, Ejemplos. Texto en español y sin dependencias nuevas.
- Documentar las ocho opciones largas actuales y `-h`: `--simular`, `--copiar`, `--solo`, `--proyecto`, `--agente`, `--skills-proyecto`, `--migrar`, `--help`.
- Aclarar detección automática de herramientas: `--solo` filtra, no instala Claude Code ni Pi.
- `--proyecto` complementa la instalación global; configura Claude Code si se detecta. `--agente` elige su agente predeterminado (principal por defecto), no filtra los agentes globales.
- `--skills-proyecto` copia skills a `<ruta>/.pi/skills`, requiere `--proyecto`, no admite `--solo claude`; las copias se regeneran al reinstalar.
- `--migrar` trabaja solo sobre ese proyecto con Claude Code, conserva v1 en `old/v1/`, admite `--simular` y excluye las otras cinco opciones de instalación.
- Explicar enlaces por defecto frente a copias; cambiar de modo requiere desinstalar antes.
- Explicar `FLUCASTR_MODELOS` solo en modo `--copiar` (por defecto `~/.flucastr-ai/modelos.json`); el modo repo usa modelos del repo.
- Mostrar `PI_CODING_AGENT_DIR` (por defecto `~/.pi/agent`), `~/.claude` y lanzadores en `~/.local/bin` con requisito de PATH.
- Help debe terminar con código 0 antes de comprobar Node, modelos o agentes, sin escribir archivos.
- Ejecutor: constructor, porque los pasos son comprobables, no dependen de decisiones futuras, los errores previstos están acotados y no hay credenciales ni producción.

## Escenarios
- CUANDO se ejecuta `-h` o `--help` ENTONCES ambas salidas son iguales, legibles y cubren las opciones del parser.
- CUANDO se busca migrar ENTONCES se encuentra su sintaxis independiente, simulación y combinaciones prohibidas.
- CUANDO se busca instalar solo Pi con skills locales ENTONCES hay un ejemplo con `--solo pi --proyecto "/ruta/mi proyecto" --skills-proyecto`.
- CUANDO no hay Node ni configuración de modelos ENTONCES la ayuda sigue funcionando y no modifica el HOME temporal.
- CUANDO se instala o migra ENTONCES el comportamiento existente no cambia.

## Verificación
`./verify` — suite completa más regresiones de ayuda; usar HOME temporal para las pruebas nuevas, nunca la instalación real.

## Pasos
- [x] Declarar `Rama base: main` en AGENTS.md; Franco la confirmó al aprobar el plan.
  - evidencia: `AGENTS.md` (declarada `main`).
- [x] Añadir función de ayuda estática y reemplazar la extracción con sed; comprobar igualdad de `-h` y `--help`.
  - evidencia: `bash instalar.sh -h > /tmp/help-h.out && bash instalar.sh --help > /tmp/help-long.out && cmp /tmp/help-h.out /tmp/help-long.out` (exit 0).
- [x] Documentar opciones, restricciones, rutas y entorno según las decisiones; contrastar cada descripción con el parser y sus consumidores.
  - evidencia: `instalar.sh` (descripciones contrastadas con parser, validaciones y consumidores de rutas/modelos).
- [x] Añadir ejemplos de instalación normal, simulación, copia, herramienta única, agente de proyecto, skills locales y migración simulada.
  - evidencia: ejemplos en `instalar.sh` (siete escenarios documentados).
- [x] Enlazar `bash instalar.sh --help` desde Instalación del README; conservar el resumen y evitar duplicar toda la ayuda.
  - evidencia: `README.md` (sección Instalación enlaza a `bash instalar.sh --help` y conserva su resumen).
- [x] Añadir a verify comprobaciones de salida 0, igualdad de alias y presencia literal de cada opción del parser actual.
  - evidencia: `verify` (bloque 2b valida exit 0, compara alias y recorre opciones del parser).
- [x] Probar help sin Node y sin modelos usando una copia aislada del script y PATH temporal con bash y dirname.
  - evidencia: prueba aislada con `PATH` temporal de bash, dirname y cat, sin Node/modelos: exit 0; salida 2187 bytes y HOME vacío.
- [x] Comparar el árbol del HOME temporal antes y después de ambos alias; fallar si aparecen archivos o cambian contenidos.
  - evidencia: `verify` (bloque 2b compara árbol y hashes antes/después de cada alias, incluyendo sentinel).
- [x] Ejecutar `./verify` (≈1 min); corregir regresiones dentro del alcance y registrar comando, resultado y ejemplos en Evidencia.
  - evidencia: `./verify` (exit 0; salida final `VERIFY OK`; bloque 2b pasó alias, opciones y HOME temporal).

## Evidencia

$ ./verify
== 2b. ayuda de instalar.sh completa e idéntica para ambos alias ==
ok 2b: ambos alias salen 0, son idénticos y documentan las opciones del parser
VERIFY OK
exit 0

$ ./verify
== 2b. ayuda de instalar.sh completa e idéntica para ambos alias ==
ok 2b: ambos alias salen 0, son idénticos y documentan las opciones del parser
VERIFY OK
exit 0

$ ./verify
== 2b. ayuda de instalar.sh completa e idéntica para ambos alias ==
ok 2b: alias iguales, opciones dinámicas documentadas, prueba negativa y ayuda aislada sin Node/modelos
VERIFY OK
exit 0

## Notas
- Revisión del principal: encontró que el extractor de opciones podía aceptar cero opciones por escapes duplicados y que la prueba aislada sin Node/modelos solo estaba en evidencia manual. Corregido el bloque 2b: extrae dinámicamente opciones del parser, exige lista no vacía, incluye prueba negativa al quitar `--simular` e integra la copia aislada con PATH de bash/dirname/cat. La suite completa vuelve a pasar (`./verify`, exit 0).
- Diagnóstico: `--help` usa `sed -n '2,3p' "$0"`; solo muestra dos comentarios y omite migración y explicaciones.
- Franco aprobó el plan y confirmó `main` como rama base. Comprobación previa: rama `main`, sin cambios fuera de este plan; la declaración duradera de base se incluye en la ejecución para mantener limpia la base; `git fetch` correcto y `git rev-list --count HEAD..origin/main` = 0.
- Verificación inicial: `./verify` terminó con código 0 y `VERIFY OK`.
- No corregir validaciones ni combinaciones sorprendentes al documentarlas: describir el comportamiento actual. Si una prueba nueva revela otro fallo, registrarlo y devolver PAUSA si exige ampliar alcance.
- La prueba aislada inicial con PATH limitado solo a bash y dirname falló porque la ayuda estática por heredoc necesita `cat`; se ajustará el PATH temporal para incluir también `cat`, sin añadir dependencia nueva.
- Antes de ejecutar: confirmar base, comprobar limpieza y actualización remota según las reglas del principal; este borrador no autoriza ejecución.
