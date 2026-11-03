# task-01 — Skill `lectura-extra` y puntero en `constructor`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Nace la skill `lectura-extra`: la excepción blanda para leer un archivo de `Evita leer:` (o de «No lees…» del agente), con tope y declaración. Se crea junto con el puntero en `agentes/constructor.md` porque `contrato-roles` exige que toda skill aparezca entre comillas invertidas en algún agente. También se anota la base de la verificación rápida, para comparar en task-06.

## Contexto
- Tocar: `skills/lectura-extra/SKILL.md`, `agentes/constructor.md`, `README.md`
- Hoy (confirmado, `wc -c`): `agentes/constructor.md` mide 2945 B (tope 3072 en `pruebas/comprobaciones/topes-bytes.test.mjs`). Su sección «Qué lees» (líneas 42–47) termina con la viñeta «- No lees tareas `hecha` ajenas a `depende_de:`.».
- `README.md` «## Estructura» lista las skills en líneas `│   ├── <skill>/` (líneas 82–93); `pruebas/comprobaciones/readme-estructura.test.mjs` exige que coincida con `skills/`. La última es `│   └── ejecutar-tarea/` (línea 93) y antes `│   ├── control-consumo/`.
- Reglas de `contrato-roles.mjs`: front matter con `name` igual a la carpeta y `description` no vacía; la skill debe aparecer entre comillas invertidas en un agente.
- Base de la rápida (confirmado, ejecutado el 2026-11-02, antes de F30): `bash pruebas/rapida.sh` da 521 pruebas, 514 pasan, 7 fallan (preexistentes: `definitions/BACKLOG.md real cumple el formato` por la celda con barra de F26, y seis de `higiene-contexto.test.mjs` por el tamaño de `WORKFLOW.md`), unos 18 s.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Modelo: dos líneas, dos dueños»

## Decisiones ya tomadas
- Contenido literal de `skills/lectura-extra/SKILL.md` (no se reformula):
```
---
name: lectura-extra
description: "Excepción de lectura para arquitecto, planificador y constructor: cuándo leer un archivo de `Evita leer:` o de «No lees…», con tope y declaración. No aplica al coordinador."
---

# Lectura extra

1. Un archivo de `Evita leer:` del encargo, o de «No lees…» de tu agente, se lee solo si la tarea no se puede cerrar sin él. Antes, ubica la sección con `grep -n '^## '` y lee solo esa con `offset` y `limit`.
2. Tope: 15 KB por lectura, 3 lecturas y 30 KB por llamada.
3. Declara cada lectura en tu retorno, tras la primera línea de estado: `Lectura extra: <ruta>; motivo=<qué te falta>`.
4. Si hace falta más que el tope, o el archivo es duro (`.env`, llaves, credenciales, `registro/`, `features/completed/`), no lo leas y responde con la primera línea `BLOQUEO: rol=franco; motivo=lectura: <ruta>`. No se enruta a otro rol.
5. Esta excepción no aplica al `coordinador`.
```
- Puntero en `agentes/constructor.md`: una viñeta nueva al final de «Qué lees», literal: «- Un archivo de `Evita leer:` solo se lee con `lectura-extra`.» (63 B).
- README: línea nueva `│   ├── lectura-extra/` justo después de `│   ├── control-consumo/`.
- El tope de `skills/lectura-extra` en `topes-bytes` y las frases del manifiesto van en task-02, no aquí.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la skill, una viñeta en `constructor.md` y una línea en el árbol del README.
Fuera de alcance: `agentes/arquitecto.md`, `agentes/planificador.md`, `agentes/coordinador.md`, `skills/revisar-proyecto-existente` (su única línea «No leas `.env`…» es permiso duro y no cambia), `pruebas/comprobaciones/*`, `definitions/*`, `instalar.sh` (enlaza `skills/*/` por glob).

## Pasos
1. Antes de editar, corre `bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖|rapida:"` y anota en *Notas* la línea `Base rápida: tests=<n>; pass=<n>; fail=<n>; segundos=<n>; fallos=<títulos>`.
2. Crea `skills/lectura-extra/SKILL.md` con el contenido literal de *Decisiones ya tomadas*.
3. Agrega la viñeta del puntero al final de «Qué lees» de `agentes/constructor.md`.
4. Agrega `│   ├── lectura-extra/` al árbol de `README.md`.
5. Corre la verificación.

## Criterios de aceptación
1. La skill existe con front matter válido; se comprueba con `node --test pruebas/comprobaciones/contrato-roles.test.mjs` (`fail 0`).
2. `agentes/constructor.md` mide como máximo 3072 B; se comprueba con `wc -c`.
3. La skill mide como máximo 2048 B; se comprueba con `wc -c`.
4. El árbol del README coincide con `skills/`; se comprueba con `readme-estructura.test.mjs`.
5. *Notas* trae la línea `Base rápida:`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
wc -c < agentes/constructor.md
wc -c < skills/lectura-extra/SKILL.md
grep -c "lectura-extra" agentes/constructor.md README.md
```
Esperado: `ℹ fail 0`; luego un número ≤ 3072; luego un número ≤ 2048; luego `agentes/constructor.md:1` y `README.md:1`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs
✔ control negativo sintético: skills/control-consumo/SKILL.md con tope+1 excede y con tope no excede (0.092833ms)
ℹ tests 136
ℹ suites 0
ℹ pass 136
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 246.253583
exit 0
```

```
$ wc -c < agentes/constructor.md
    3008
exit 0
```

```
$ wc -c < skills/lectura-extra/SKILL.md
     925
exit 0
```

```
$ grep -c "lectura-extra" agentes/constructor.md README.md
agentes/constructor.md:1
README.md:1
exit 0
```

## Notas
- Base rápida: tests=535; pass=527; fail=8; segundos=22; fallos=definitions/BACKLOG.md real cumple el formato; las tareas reales de features/ cumplen el formato; los archivos reales cumplen la regla; falla si un agente conserva la línea de modelos.json; falla si falta la lectura acotada en constructor; falla si falta la lectura acotada en ejecutar-tarea; falla si WORKFLOW.md pasa de 30720 caracteres; falla si WORKFLOW.md conserva la frase sobre modelos.json
- Hueco menor: la base escrita en la tarea (521 pruebas, 514 pasan, 7 fallan, unos 18 s) no coincide con la medida hoy; se anotó la medida real. Los 8 fallos ocurren antes de tocar archivos y no los causa esta tarea.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit; el trabajo quedó en `feature/F33-reglas-de-lectura`.
- Pasada 1 de verificación: `node --test` iba con `| tail`, así que el `exit` no se capturó; pasada 2 completa sin pipe, con el código real. Ambas pasadas dan `fail 0`.
- Cambios: `skills/lectura-extra/SKILL.md` (nueva, contenido literal), viñeta en «Qué lees» de `agentes/constructor.md`, línea `│   ├── lectura-extra/` en el árbol de `README.md`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
