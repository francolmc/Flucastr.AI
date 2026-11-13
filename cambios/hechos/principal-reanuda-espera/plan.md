---
estado: listo
rama: fix/principal-reanuda-espera
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# El principal reanuda la espera tras responder a Franco

## Objetivo
Si Franco escribe al principal mientras el constructor sigue en curso, el principal responde y vuelve a esperar al constructor en el mismo turno, en vez de cerrar el turno y dejar el retorno sin recibir.

## Supuestos
- Aplica a cualquier soporte, aunque el caso observado fue Codex (`wait_agent`). Si Franco lo quiere solo para Codex, se quita la frase genérica y queda la línea de Codex.
- No se cambia el presupuesto de llamadas ni la receta de espera de `verify` (paso 5): solo se añade la reanudación en el paso 4.

## Alcance
Puede cambiar: `agentes/principal.md` (paso 4, viñeta de la espera) y `verify` (bloque nuevo 8n, al final de los bloques 8).
Fuera de alcance: `agentes/constructor.md`, `modelos.json`, `instalar.sh`, `scripts/`, skills, y los proyectos que usan el kit.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: requisitos cubiertos, archivos accesibles, comprobaciones con resultado esperado, sin credenciales ni producción.
- Evidencia del fallo (DonFinancio, 12-nov, sesión Codex `rollout-2026-11-12T13-26-43-…`): a las 02:42:13Z llega «termino?», el principal llama `list_agents` (el constructor de F06 figura `running`), responde «Todavía no» y emite `task_complete` sin volver a `wait_agent`.
- Texto a añadir al final de la viñeta de espera del paso 4, sin quitar nada de lo existente: «Si Franco te escribe mientras el constructor sigue en curso, responde en una línea y vuelve a esperar en el mismo turno; no cierres el turno con el retorno pendiente.»
- Se conserva «una sola espera» (lo exige el bloque 8k de `verify`) y `yield_time_ms: 300000` y «no cuentan» (8l).

## Escenarios
- CUANDO `agentes/principal.md` se lee ENTONCES la viñeta de espera del paso 4 contiene la frase «vuelve a esperar en el mismo turno» (A1).
- CUANDO una copia de `principal.md` no trae esa frase ENTONCES el nuevo bloque de `verify` falla (A2).
- CUANDO se corre el `verify` completo del kit ENTONCES los bloques 8k y 8l siguen pasando (A3).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | La frase está en el paso 4 | `grep -n 'vuelve a esperar en el mismo turno' agentes/principal.md` | una línea, dentro del paso 4 (antes de «5. **Al volver el constructor.**») |
| A2 | El chequeo es sensible | copia de `principal.md` con `sed` que cambia la frase; correr la función del bloque 8n sobre ella | la función devuelve error para la copia y éxito para el original |
| A3 | No se rompe lo vecino | `./verify` | termina en exit 0 con `ok 8k` y `ok 8l` en la salida |

## Verificación
`./verify` — offline, sin Docker del proyecto; debe terminar en exit 0.

## Pasos
- [x] En `agentes/principal.md`, paso 4, añade el texto de *Decisiones* al final de la viñeta que empieza «Haz una sola espera larga» (A1)
  - evidencia: `grep -n 'vuelve a esperar en el mismo turno' agentes/principal.md` devuelve la línea 32 (dentro del paso 4, antes de «5. **Al volver el constructor.**»); «una sola espera» sigue presente (2 coincidencias).
- [x] En `verify`, copia el patrón del bloque 8l como bloque 8n: función `textos_reanuda` que exige `vuelve a esperar en el mismo turno` en `agentes/principal.md`, comprobación sobre el original y copia negativa con `sed` (A2)
  - evidencia: `verify` con bloque 8n (líneas 997-1009 aprox., tras el bloque 8m). Comprobación manual: original `grep -qF` exit 0; copia con la frase cambiada por `termina el turno` exit 1. El bloque dentro de `verify` imprime `ok 8n` y pasa.
- [x] Corre `./verify` y pega la cola en *Evidencia* (A3)
  - evidencia: `./verify` exit 0; `ok 8k`, `ok 8l`, `ok 8n` en la salida (ver *Evidencia*).

## Evidencia
$ ./verify
ok 8k: principal con «Solo creas o editas», «APROBADO», «no corriges» y «una sola espera»; copias sin la lista o con la frase vieja fallan
ok 8l: principal con «yield_time_ms: 300000» y «no cuentan»; copia sin la receta falla
ok 8n: principal con «vuelve a esperar en el mismo turno» en el paso 4; copia sin la frase falla
...
pruebas del medidor: 19 de 19 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
== 13. kit run: arnés con constructor, verify y revisor simulados ==
ok A1 ciclo completo: listo, constructor una vez, revisor en solo lectura
...
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas
- Tramo único, sin `tramo:`. Cambios: `agentes/principal.md` (una frase añadida al final de la viñeta de espera del paso 4) y `verify` (bloque 8n tras 8m). Diff de 13 líneas en 2 archivos.
- Comprobación de A2 hecha a mano con `grep -qF` sobre el original (exit 0) y sobre una copia con `sed` (exit 1), igual que el bloque 8n.
- Incidente: por error ejecuté `bash` sobre `plan.md` (Markdown, no script) para contar pendientes. Las comillas invertidas pudieron ejecutar comandos de solo lectura o de reejecución (`grep`, `sed`, `./verify`). `git status` y `git diff` después muestran solo los dos archivos previstos; el plan quedó intacto. El contador se rehízo con `awk`.
