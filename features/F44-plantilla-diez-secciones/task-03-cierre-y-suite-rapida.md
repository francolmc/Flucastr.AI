# task-03 — Cierre de F44: suite rápida en verde
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Comprueba que F44 no rompió nada: corre la verificación rápida completa y los chequeos de bytes de la skill. Es la tarea de cierre del cambio; no modifica archivos del producto.

## Contexto
- Tocar: `features/F44-plantilla-diez-secciones/task-03-cierre-y-suite-rapida.md`
- `pruebas/rapida.sh` corre `node --test` sobre `pruebas/comprobaciones/*.test.mjs`, `pruebas/*.test.mjs` y cuatro pruebas de `pruebas/capa1/`, con tope de 90 s (`FLUCASTR_TOPE_RAPIDA`); termina en 0 si todo pasa. Su comando entero supera los 180 s solo si la máquina está cargada: en ese caso se anota en *Notas* y se declara `largo:300`.
- La skill y la prueba nueva las dejaron task-01 y task-02; si algo falla, esta tarea no lo arregla.
- Solo se escriben *Evidencia* y *Notas* de esta tarea.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25, largo:300

## Decisiones ya tomadas
- Si `bash pruebas/rapida.sh` falla, no se edita nada: la tarea queda `bloqueada` con `Bloqueo: tipo=verificacion_x2` solo tras la segunda falla por la misma causa; antes, se repite el comando una vez.
- Una falla por `definitions/STATUS.md` o `definitions/BACKLOG.md` modificados por el flujo no es causa de esta feature: se anota en *Notas* con el nombre de la prueba y se informa.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr los comandos de verificación y pegar su salida.
Fuera de alcance: editar skills, pruebas, scripts o definiciones; la corrida con modelo real (task-04); el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Corre `wc -c skills/descomponer-feature/SKILL.md` y anota los bytes.
3. Corre `node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs`.
4. Corre `bash pruebas/rapida.sh` y pega las últimas líneas en *Evidencia*.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. La skill pesa ≤ 6400 bytes (comando 2).
3. Las tres pruebas puntuales terminan con `# fail 0` (comando 3).
4. `bash pruebas/rapida.sh` termina con código 0 (comando 4).

## Verificación
```
git branch --show-current
wc -c skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
bash pruebas/rapida.sh; echo "salida $?"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; `wc -c` ≤ 6400; el resumen de `node --test` trae `# fail 0`; la última línea impresa es `salida 0` y `rapida.sh` imprime `rapida:` con su duración.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ wc -c skills/descomponer-feature/SKILL.md
    6395 skills/descomponer-feature/SKILL.md
exit 0
```

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/plantilla-diez-secciones.test.mjs
# tests 156
# suites 0
# pass 156
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 113.127917
exit 0
```

```
$ bash pruebas/rapida.sh; echo "salida $?"
ℹ tests 877
ℹ suites 0
ℹ pass 877
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 42087.854792
rapida: 63 archivos en 42 s (tope 90 s)
salida 0
exit 0
```

## Notas
- Huecos menores: el segundo comando de `node --test` y `bash pruebas/rapida.sh` se corrieron con redirección a un archivo en el scratchpad para capturar el código de salida real (zsh no expone `PIPESTATUS` en el primer intento). El `echo "salida $?"` se lanzó tras esa redirección; el código es el real de `rapida.sh`.
- `rapida.sh` terminó en 42 s, por debajo del tope de 90 s; no hizo falta `largo:300` por carga de máquina.
- `scripts/validar-tarea.mjs` se corrió para validar la evidencia antes de cambiar a `lista para revisión`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
