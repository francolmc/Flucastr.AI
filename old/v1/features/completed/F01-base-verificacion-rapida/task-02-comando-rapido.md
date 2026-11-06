# task-02 — Comando de verificación rápida (`pruebas/rapida.sh`)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Hoy no hay una sola orden que Franco corra para confiar en un cambio: la suite completa tarda ~46 s, de los cuales ~32 s son `contrato.test.mjs` (fixtures Git de B/M/R que solo importan al tocar el contrato del arquitecto). Esta tarea crea `pruebas/rapida.sh`, que corre todo lo determinista salvo ese archivo y falla si pasa de 30 s, y la documenta en el README. Es la base sobre la que se añaden las demás comprobaciones de F01.

## Contexto
- Repo: este, único repo. Sin modelo ni red.
- Leídos y ejecutados por el planificador: el conjunto «suite menos `contrato.test.mjs`» más Capa 1 son 7 archivos de prueba, 34 pruebas, 0 fallos, ~13 s en total. Los 7 archivos: `pruebas/comprobaciones/{agente-instalado,escenarios,registro.e2e,registro}.test.mjs`, `pruebas/{ejecutar,lanzadores}.test.mjs` y `pruebas/capa1/instalacion.test.mjs`.
- `pruebas/comprobaciones/contrato.test.mjs` queda fuera de la rápida (6 pruebas, ~32 s); sigue disponible con la orden completa del README.
- `pruebas/capa1/instalacion.test.mjs` deja un directorio nuevo en `pruebas/.temporales/` en cada corrida (ignorado por Git); es comportamiento existente.
- Convención de los `.sh` del repo: `#!/usr/bin/env bash` y `set -euo pipefail` (ver `pruebas/ejecutar.sh`). Texto en español.
- `pruebas/README.md` tiene hoy una línea «La suite automática: …» y una de «Capa 1: …».

## Decisiones ya tomadas
- Nombre y ruta: `pruebas/rapida.sh`. Se invoca con `bash pruebas/rapida.sh` desde cualquier directorio.
- La rápida = todos los `*.test.mjs` de `pruebas/comprobaciones/` y `pruebas/` más `pruebas/capa1/instalacion.test.mjs`, excluyendo solo `contrato.test.mjs`. Los archivos de prueba nuevos de las tareas siguientes entran solos por el glob.
- Tope: 30 s por defecto, sobrescribible con la variable `FLUCASTR_TOPE_RAPIDA`. Si se supera, sale con código 1 aunque las pruebas pasen.
- Contenido exacto del script:
```
#!/usr/bin/env bash
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ"
TOPE="${FLUCASTR_TOPE_RAPIDA:-30}"
archivos=()
for f in pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/instalacion.test.mjs; do
  [[ "$f" == */contrato.test.mjs ]] && continue
  archivos+=("$f")
done
inicio=$SECONDS
node --test --test-concurrency=1 "${archivos[@]}"
duracion=$((SECONDS - inicio))
echo "rapida: ${#archivos[@]} archivos en ${duracion} s (tope ${TOPE} s)"
if (( duracion > TOPE )); then
  echo "FALLA: la verificación rápida superó el tope de ${TOPE} s" >&2
  exit 1
fi
```
- El README nombra dos niveles: «rápida» (la nueva) y «completa» (la orden actual de `pruebas/README.md`, que se conserva tal cual).

## Alcance / Fuera de alcance
Alcance: crear `pruebas/rapida.sh` y actualizar `pruebas/README.md`.
Fuera de alcance: modificar cualquier prueba existente, paralelizar, acelerar `contrato.test.mjs`, limpiar `pruebas/.temporales/`, tocar `definitions/PROJECT.md` o `AGENTS.md`, hacer commit.

## Pasos
1. Crear `pruebas/rapida.sh` con el contenido exacto de *Decisiones ya tomadas*.
2. En `pruebas/README.md`, justo antes de la línea «La suite automática: …», añadir una línea: «Verificación rápida (sin modelo ni red, tope 30 s, excluye `contrato.test.mjs`): `bash pruebas/rapida.sh`.»
3. En esa misma línea «La suite automática: …», anteponer la palabra «completa» para que lea «La suite automática completa (incluye `contrato.test.mjs`, ~45 s): …» sin cambiar la orden.
4. Correr `bash pruebas/rapida.sh` y pegar el final de la salida en *Evidencia*.
5. Correr con `FLUCASTR_TOPE_RAPIDA=1` y confirmar que sale con código 1 (control negativo del tope).

## Criterios de aceptación
1. `bash pruebas/rapida.sh` sale con código 0, reporta `ℹ pass 34`, `ℹ fail 0` y termina con `rapida: 7 archivos en N s (tope 30 s)` con N ≤ 30. Se comprueba con la primera orden.
2. Con `FLUCASTR_TOPE_RAPIDA=1` sale con código 1 y escribe «FALLA: la verificación rápida superó el tope de 1 s». Se comprueba con la segunda orden.
3. La rápida no ejecuta `contrato.test.mjs`: ninguna prueba llamada «contrato duro» aparece. Se comprueba con la tercera orden (debe imprimir 0).
4. Funciona desde otro directorio. Se comprueba con la cuarta orden.
5. `pruebas/README.md` contiene la orden `bash pruebas/rapida.sh` y conserva la orden completa. Se comprueba con la quinta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ (tests|pass|fail)|rapida:)"; echo "rc=${PIPESTATUS[0]}"
FLUCASTR_TOPE_RAPIDA=1 bash pruebas/rapida.sh 2>&1 | grep -E "^FALLA"; echo "rc=${PIPESTATUS[0]}"
bash pruebas/rapida.sh 2>&1 | grep -c "contrato duro"
(cd /tmp && bash /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/rapida.sh 2>&1 | grep -E "^rapida:")
grep -c "bash pruebas/rapida.sh\|pruebas/comprobaciones/\*.test.mjs pruebas/\*.test.mjs" pruebas/README.md
```
Salida esperada: `ℹ tests 34`, `ℹ pass 34`, `ℹ fail 0`, `rapida: 7 archivos en N s (tope 30 s)` y `rc=0`; luego el mensaje de FALLA y `rc=1`; luego `0`; luego otra línea `rapida: 7 archivos …`; y por último `2`.

## Evidencia

Paso 4 y verificación 1 (salida real):
```
$ bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ (tests|pass|fail)|rapida:)"; echo "rc=${PIPESTATUS[0]}"
ℹ tests 34
ℹ pass 34
ℹ fail 0
rapida: 7 archivos en 16 s (tope 30 s)
rc=                       (vacío: el shell es zsh, no define PIPESTATUS; el código real está abajo)

$ bash pruebas/rapida.sh 2>&1 | tail -n 12
✔ lanzar-pi.sh: sintaxis Bash válida (5.726958ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (47.187333ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.259292ms)
ℹ tests 34
ℹ suites 0
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 15286.290542
rapida: 7 archivos en 15 s (tope 30 s)
```

Códigos de salida medidos con `$?` (salida en archivo en el scratchpad):
```
$ bash pruebas/rapida.sh > rc-ok.txt 2>&1; echo "rc_normal=$?"
rc_normal=0
ℹ tests 34
ℹ pass 34
ℹ fail 0
rapida: 7 archivos en 14 s (tope 30 s)

$ FLUCASTR_TOPE_RAPIDA=1 bash pruebas/rapida.sh > rc-tope.txt 2>&1; echo "rc_tope1=$?"
rc_tope1=1
FALLA: la verificación rápida superó el tope de 1 s

$ bash pruebas/rapida.sh > /dev/null 2>&1; echo "rc_segunda_corrida=$?"
rc_segunda_corrida=0
```

Verificación 2 (control negativo del tope, con `grep` como en la tarea):
```
$ FLUCASTR_TOPE_RAPIDA=1 bash pruebas/rapida.sh 2>&1 | grep -E "^FALLA"
FALLA: la verificación rápida superó el tope de 1 s
rc=1 (medido con $?)
```

Verificación 3 (ninguna prueba «contrato duro» en la rápida):
```
$ bash pruebas/rapida.sh 2>&1 | grep -c "contrato duro"
0
```

Verificación 4 (desde otro directorio):
```
$ (cd /tmp && bash /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/rapida.sh 2>&1 | grep -E "^rapida:")
rapida: 7 archivos en 14 s (tope 30 s)
```

Verificación 5 (README conserva la orden completa y añade la rápida):
```
$ grep -c "bash pruebas/rapida.sh\|pruebas/comprobaciones/\*.test.mjs pruebas/\*.test.mjs" pruebas/README.md
2
```

Criterios de aceptación: 1 OK (rc 0, pass 34, fail 0, 7 archivos en 14–16 s ≤ 30). 2 OK (rc 1 y mensaje FALLA). 3 OK (0 coincidencias). 4 OK (desde /tmp). 5 OK (2 coincidencias: línea de la rápida y línea de la completa).

## Notas
- Hueco menor: la tarea no decía permisos. Di `chmod +x pruebas/rapida.sh` por la convención de `pruebas/ejecutar.sh`; la orden documentada `bash pruebas/rapida.sh` no lo necesita.
- Hueco menor: la tarea usa `PIPESTATUS`, que zsh no define. El código de salida se midió con `$?` en una corrida aparte; la primera verificación imprime `rc=` vacío por eso. No cambié el comando de la tarea.
- La verificación 4 escribe en `/tmp` solo porque así lo indica la tarea (`cd /tmp` es un directorio de prueba, no un archivo de trabajo).
- `pruebas/capa1/instalacion.test.mjs` deja un directorio nuevo en `pruebas/.temporales/` en cada corrida (ignorado por Git). Es comportamiento existente y no se tocó.
- Tiempo medido: 14 a 16 s por corrida, dentro del tope de 30 s.
- `contrato.test.mjs` queda fuera; no se modificó ninguna prueba existente.
- Los cambios sin commitear de otros archivos (`definitions/BACKLOG.md`, `definitions/STATUS.md`, `task-01-limpieza-pruebas.md`) no se tocaron. Solo hay cambios nuevos en `pruebas/rapida.sh` (nuevo) y `pruebas/README.md`, además de esta tarea.
- Sin commit, push, PR, merge ni despliegue. `STATUS.md` no se editó.
