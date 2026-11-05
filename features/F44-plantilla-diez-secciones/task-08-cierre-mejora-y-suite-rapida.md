# task-08 — Cierre de la mejora: suite rápida, bytes de la skill y pruebas de contrato
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Cierra el cambio de task-05 a task-07 sin tocar código: comprueba que la skill sigue en 6400 bytes o menos, que las pruebas de contrato y de plantilla pasan y que la suite rápida termina en 0. Es el último paso que no gasta créditos antes de la corrida real.

## Contexto
- Tocar: `features/F44-plantilla-diez-secciones/task-08-cierre-mejora-y-suite-rapida.md`
- Solo se escriben *Evidencia* y *Notas* de esta tarea.
- `bash pruebas/rapida.sh` imprime `rapida:` con su duración y termina en 0 si todo pasa.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25, largo:150

## Decisiones ya tomadas
- Si algo falla no se corrige aquí: la tarea queda `bloqueada` con `BLOQUEO: rol=constructor; motivo=codigo: <causa>`.
- Los comandos no dependen de que git o `definitions/` estén limpios.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr los comandos y pegar su salida.
Fuera de alcance: editar skills, scripts, pruebas o definiciones; la corrida con modelo real (task-09); el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre `wc -c skills/descomponer-feature/SKILL.md` y anota los bytes.
3. Corre `node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs`.
4. Corre `bash pruebas/rapida.sh` y pega las últimas líneas en *Evidencia*.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. La skill pesa 6400 bytes o menos (comando 2).
3. Las cuatro pruebas puntuales terminan con `fail 0` (comando 3).
4. `bash pruebas/rapida.sh` termina con código 0 (comando 4).

## Verificación
```
git branch --show-current
wc -c skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -E "^ℹ fail"
bash pruebas/rapida.sh; echo "salida $?"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; `wc -c` imprime un número ≤ 6400 (`6372` esperado); el tercer comando imprime `ℹ fail 0`; la última línea impresa es `salida 0` y `rapida.sh` imprime `rapida:` con su duración.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0

$ wc -c skills/descomponer-feature/SKILL.md
    6372 skills/descomponer-feature/SKILL.md
exit 0

$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ bash pruebas/rapida.sh; echo "salida $?"
ℹ tests 885
ℹ pass 885
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 34488.608666
rapida: 64 archivos en 35 s (tope 90 s)
salida 0
exit 0
```

Criterios: 1 rama OK; 2 skill 6372 bytes <= 6400 OK; 3 cuatro pruebas con fail 0 OK; 4 rapida.sh termina en 0 OK.

## Notas
Hueco menor: la verificación se corrió dos veces; la primera pasada se hizo con comandos encadenados (cd y git -C) y la segunda con los comandos tal cual de la tarea, que es la que queda en Evidencia. La salida de rapida.sh de la segunda pasada se guardó en un archivo del scratchpad; el comando es el mismo y sale 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
