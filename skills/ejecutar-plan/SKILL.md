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

Si el plan trae `tramo: <n>` en el frontmatter, ejecuta solo los pasos de `### Tramo <n>`; los demás no los tocas. Su verificación es la línea `Verificación del tramo:`; si el tramo es el último, corre además la *Verificación* del plan completa. Si el plan es un índice con `tramo-<n>.md` junto a él, lees solo ese archivo. Sin `tramo:`, es un plan de un solo tramo. Al cerrar un tramo, escribe en *Notas* del plan un resumen de 5 líneas (qué quedó, qué sigue) para que el principal pida a Franco `/compact` o una sesión nueva con `Plan: <ruta>`.

## Bucle de ejecución

Para cada paso `- [ ]`, en orden:

- Agrupa en una sola llamada las lecturas independientes del paso y lee cada archivo una vez.
- Ritmo: lee el archivo que vas a cambiar; reproduce el estado de partida con un comando y anota su salida; cambia lo mínimo dentro de *Alcance* (nunca recortes, pospongas ni simplifiques lo pedido); vuelve a correr el mismo comando y compara con la salida anotada. Marca el paso solo si se cumple su A#.
- Verifica cada unidad coherente al terminarla. Marca `- [x]` solo si el comportamiento especificado está **completo** y comprobado, y debajo agrega `  - evidencia: <archivos creados, o comando y exit N>`.
- Cuenta pendientes con el bloque `bash pendientes-plan` (abajo), pasando la ruta del plan como `$1`. Registra la cuenta; un error de lectura no es cero. Con pendientes, sigues salvo bloqueo permitido.
- Corrige fallos relacionados dentro del alcance y anótalos en *Notas*.
- Salidas largas (build, `verify`, listados): muestra solo la cola y los errores; usa opciones silenciosas cuando existan.
- Comandos largos (`verify`, builds): espéralos con una sola llamada (Claude Code, `timeout` máximo o `run_in_background` y esperar su aviso; Pi, el timeout de `bash`; Codex, `exec_command` en una celda `exec` y, cuando devuelva «Script running with cell ID N», una sola llamada `wait` con ese `cell_id` y `yield_time_ms: 300000`). Nunca bucles de `sleep`, `tail` ni consulta de estado.

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

En *Evidencia* pega cada comando de verificación como `$ <comando>`, idéntico al del plan, con su salida **real** (la cola relevante, hasta unos 1,5 KB; nunca inventada) y una última línea `exit N` con el código real.
## Al terminar

- En *Notas*: decisiones menores que tomaste y fallos relacionados que corregiste.
- Estados y primera línea de respuesta (`COMPLETADO` o `PAUSA`): ver *Límites* y *Retorno* del constructor.
