---
name: ejecutar-plan
description: "Aplica un plan aprobado de `cambios/<nombre>/plan.md`: recorre los pasos, corrige dentro del alcance, corre `verify` y deja evidencia real. Úsala al construir."
---

# Ejecutar un plan

Entrada: la ruta del plan.

## Antes de empezar

1. Lee el plan completo por tramos. Si `estado` no es `aprobado`, detente; no cambies nada.
2. Si el encargo trae `Rama:`: para cada carpeta de `repos:` del frontmatter, y solo esas:
   - Si no tiene `.git`, anótalo en *Notas* y sigue.
   - Si `git -C <carpeta> branch --show-current` ya es la rama, sigue.
   - Si existe (`git -C <carpeta> rev-parse --verify --quiet refs/heads/<rama>`), `PAUSA` con `motivo=acceso`.
   - Comprueba la rama base (`base:`; si falta, `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`) y que no haya cambios fuera de `cambios/<nombre>/` con `git status`/`git diff`. Si no cumple, `PAUSA` con `motivo=acceso`.
   - Si cumple, crea únicamente la rama autorizada: `git -C <carpeta> switch -c <rama>` (en `.`, `git switch -c <rama>`).
   - Si falta `repos:`, `PAUSA` con `motivo=ambiguo`.
3. Cambia `estado: en curso`.

Git, estados y retorno: ver *Límites* y *Retorno* del constructor.

Con `tipo: docs`, al terminar confirma con `git diff --name-only <base>` que solo cambiaron `*.md` o `docs/`; si cambió otra cosa, `PAUSA` con `motivo=alcance`.

## Tramo

Si el plan trae `tramo: <n>` en el frontmatter, ejecuta ese tramo. En el formato nuevo, `### Tramo N — Historia: ...` identifica una historia autocontenida: lee su usuario, dependencias, alcance, CUANDO/ENTONCES, criterios `A#`, TODO y *Handoff*. Usa el handoff para orientar la implementación y revisión; comprueba cada criterio `A#` mencionado y ejecuta solo sus pasos TODO. Las dependencias declaradas deben estar terminadas antes de comenzar; si no, detente y registra dónde retomar. En planes antiguos, sigue los pasos y aceptación declarados en su formato existente.

Por defecto, una ejecución termina al cerrar el tramo activo. Solo si el plan aprobado declara `continuidad: continua`, puedes seguir a los tramos aprobados siguientes de la misma historia en la misma ejecución. Lee cada archivo de tramo justo antes de usarlo; no avances a otra historia. Tras cada tramo añade en *Notas* un punto de control con archivos tocados, resumen del diff y comprobación; no hagas commit. Si la historia termina, detente para que el principal revise en contexto nuevo. Si el plan declara `Revisión: por tramo`, espera esa revisión antes de avanzar.

En continuidad, aplica las *Condiciones de parada* del plan. Si no hay duración previa registrada para la comprobación exacta en entorno equivalente, pausa antes de ejecutarla. Envuélvela con un límite de dos veces esa duración, por ejemplo `timeout <2x-segundos>s <comando>`; si vence, deja la casilla pendiente y registra la pausa. Tras el primer fallo por una causa, diagnostica y corrige solo dentro del alcance; si vuelve a fallar por la misma causa, pausa con lo hecho, lo que falta y el motivo. Pausa también si hace falta salir del alcance o una decisión de Franco. Las dudas menores dentro del alcance se registran bajo `Decisiones` y no interrumpen el avance. En continuidad, puedes actualizar `tramo:` al avanzar dentro de la misma historia y anotar esas decisiones menores en *Decisiones*; conserva `estado: en curso` al avanzar y cámbialo a `parcial` al pausar, deja una nota retomable con lo hecho, lo que falta y la causa. El principal revisa la nota y vuelve a aprobar antes de reanudar. No cambies `Alcance` ni `Aceptación`. En planes sin continuidad conserva el procedimiento y contenido del plan existente.

Su verificación es la línea `Verificación del tramo:`; si el tramo es el último del plan, corre además la *Verificación* completa. En un índice, lee `tramo-<n>.md` del tramo activo; para continuidad, abre después cada siguiente tramo de la misma historia que vayas a ejecutar. Sin `tramo:`, es un plan de un solo tramo. Al cerrar cada tramo registra el punto de control; al cerrar una historia deja el resumen para que el principal revise desde contexto nuevo.

## Bucle de ejecución

Para cada paso `- [ ]`, en orden:

- Agrupa en una sola llamada las lecturas independientes del paso y lee cada archivo una vez.
- Ritmo: lee el archivo que vas a cambiar; reproduce el estado de partida con un comando y anota su salida; cambia lo mínimo dentro de *Alcance* (nunca recortes, pospongas ni simplifiques lo pedido); vuelve a correr el mismo comando y compara con la salida anotada.
- Verifica cada unidad coherente al terminarla con la `Comprobación rápida` del `AGENTS.md` (Nivel 1, sin Docker) si existe; si no, con `verify`. El `verify` con Docker queda para la *Verificación final* y para `Verificación del tramo:` (cada una con el nivel que declara).
- En cuanto un paso esté completo y su comprobación pase, marca su `- [x]` y añade la evidencia en la sección *Evidencia* del plan, antes de empezar el paso siguiente. No esperes a terminar el tramo. Cambia únicamente las casillas de pasos, su evidencia, el frontmatter `estado` y las secciones *Evidencia* y *Notas*; nunca edites *Alcance* ni *Aceptación*.
- Si el paso no tiene una comprobación explícita, déjalo sin marcar y añade en *Notas* una línea con el paso y la comprobación que falta; no inventes una ni lo declares completo. Si se interrumpe o queda incompleto, déjalo sin marcar y añade una línea con el punto exacto para retomar.
- Cuenta pendientes con el bloque `bash pendientes-plan` (abajo), pasando la ruta del plan como `$1`. Registra la cuenta; un error de lectura no es cero. Con pendientes, sigues salvo bloqueo permitido.
- Corrige fallos relacionados dentro del alcance y anótalos en *Notas*.
- Salidas largas (build, `verify`, listados): muestra solo la cola y los errores; usa opciones silenciosas cuando existan.
- Comandos largos (`verify`, builds): espéralos con una sola llamada (Claude Code, `timeout` máximo o `run_in_background` y esperar su aviso; Pi, el timeout de `bash`; Codex, `exec_command` en una celda `exec` y, cuando devuelva «Script running with cell ID N», una sola llamada `wait` con ese `cell_id` y `yield_time_ms: 300000`). Nunca bucles de `sleep`, `tail` ni consulta de estado.
- Validar con navegador o contenedores: usa un script de comando fijo del repo (`./scripts/<nombre>.sh` o `./verify`) que haga todos los recorridos y capturas en una sola corrida. No encadenes `docker run` ni `compose run` sueltos.

### Contador canónico

```bash pendientes-plan
#!/usr/bin/env bash
set -e
awk '
  /^- \[ \]/ { n++ }
  END { print n+0 }
' "$1"
```

Cuenta solo casillas pendientes raíz, imprime `0` si no hay coincidencias y propaga errores de lectura.

## Verificación final

Con los demás pasos hechos, ejecuta el comando de *Verificación* **tal cual** antes de marcar su paso específico. Los checks locales por unidad no consumen las tres corridas finales; no repitas una suite idéntica sin cambio o diagnóstico nuevo.

- Si pasa, registra salida real y marca el paso.
- Si falla, busca la causa raíz en todo el alcance, corrige dentro de él y vuelve a correr.
- **Tope:** 3 corridas finales. Si la misma causa persiste tras dos correcciones o la tercera corrida no pasa, devuelve `PAUSA` con `motivo=verify` y diagnóstico completo.
- Concluye solo con requisitos de Aceptación satisfechos, verificación final verde y cero pasos pendientes. Las casillas son progreso declarado, no evidencia independiente.

## Cuenta, contexto y pausa

- Si el harness avisa un corte inminente, persiste avance y siguiente acción en *Notas*; no declares COMPLETADO. Una interrupción deja `en curso`, no es PAUSA de producto. El principal reconstruye el estado y vuelve a aprobar antes de reanudar.
- Pausa solo en estos casos:
  - Un paso es ambiguo y varias lecturas cambian el resultado → `motivo=ambiguo`.
  - La solución del plan no funciona (problema de diseño) → `motivo=diseño`.
  - Hace falta trabajo fuera de *Alcance* o que cambia un comportamiento especificado → `motivo=alcance`.
  - Falta una credencial, un acceso o una herramienta → `motivo=acceso`.
  - `verify` no pasa en 3 corridas → `motivo=verify`.
- Antes de una `PAUSA` con `motivo=ambiguo` o `motivo=acceso`, busca `Resuelto:` en *Decisiones ya tomadas* del plan. Lo que ya figura como `Resuelto:` no se vuelve a pedir: lo aplicas tal cual.
- El formato de `PAUSA` (primera línea y, debajo, el problema con 2 o 3 opciones) está en *Retorno* del constructor.

No adivines: pausa. Deja lo hecho como está.

## Evidencia

En *Evidencia* pega cada comando de verificación como `$ <comando>`, idéntico al del plan, con su salida **real** (la cola relevante, hasta unos 1,5 KB; nunca inventada) y una última línea `exit N` con el código real. Añade cada entrada inmediatamente al marcar el paso correspondiente.
## Al terminar

- En *Notas*: decisiones menores que tomaste y fallos relacionados que corregiste.
- Estados y primera línea de respuesta (`COMPLETADO` o `PAUSA`): ver *Límites* y *Retorno* del constructor.
