# task-02 — Script de corrida de «excedido» + «A» en Pi y Claude Code
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Deja lista la prueba con modelo real (patrón F12) sin ejecutarla: `pruebas/correr-excedido.sh HERRAMIENTA` crea el fixture de task-01, lanza el coordinador dos veces (etapa 1 «Continúa con el flujo.»; etapa 2 «A») con el lanzador de F12 de esa herramienta y escribe el informe en `pruebas/resultados/AAAA-MM-DD-excedido-<herramienta>.md`. Solo MIDE. Las pruebas automáticas usan un modelo simulado; la corrida real la hace Franco (ver *Fuera de alcance*).

## Contexto
- Tocar: `pruebas/correr-excedido.sh`, `pruebas/correr-excedido.test.mjs`, `pruebas/README.md`
- De `depende_de:` lee solo las *Notas* de task-01 (exportaciones de `excedido-resultado.mjs`: `informe({ dir, herramienta })`).
- Lanzadores existentes (cwd = fixture, exigen `FLUCASTR_RECORD_FILE`, un argumento = prompt): `pruebas/lanzar-coordinador-claude.sh` (binario `FLUCASTR_CLAUDE_BIN`, por defecto `claude`) y `pruebas/lanzar-coordinador-pi.sh` (binario `FLUCASTR_PI_BIN`, por defecto `pi-coordinador`; tope `FLUCASTR_PI_TOPE`, 300 s). Patrón de prueba con modelo simulado: `pruebas/lanzadores.test.mjs` (líneas 1-30, `fake-model.sh` con `spawnSync`).
- Precondición de modelos: `node pruebas/comprobaciones/modelos-agentes.mjs` (hoy imprime `modelos de agentes instalados vigentes`, sale 0). Nivel del coordinador en `modelos.json`: `medio` en ambas herramientas (`openai/gpt-6.1-sol` en Pi, `claude-sonnet-5-5` en Claude Code): mismo nivel.
- Las skills están enlazadas por symlink desde `~/.claude/skills` y `~/.pi/agent/skills` al repo (comprobado): la corrida ve el `SKILL.md` vigente del repo sin reinstalar.
- Fuente: ninguna
- Requiere: runtime:node@25
- La corrida real exige además red, sesión iniciada de `claude` o `pi-coordinador` y gasto de tokens; el vocabulario de `Requiere:` no lo admite, por eso es paso manual de Franco.

## Decisiones ya tomadas
- Uso: `bash pruebas/correr-excedido.sh {claude-code|pi}`; otro valor o ninguno: mensaje de uso en stderr y salida 2.
- Orden: (1) salvo `FLUCASTR_SIN_PRECONDICION=1` (solo para pruebas), corre `node pruebas/comprobaciones/modelos-agentes.mjs` y sale 2 si falla; (2) `base=pruebas/.temporales/excedido-<herramienta>-<PID>`; fixture en `$base/fixture`; (3) etapa 1 desde `$base/fixture` con `FLUCASTR_RECORD_FILE=$base/etapa1.jsonl`; copia `definitions/STATUS.md` a `$base/etapa1/STATUS.md`; (4) etapa 2 con prompt `A`, registro `$base/etapa2.jsonl`; copia a `$base/etapa2/STATUS.md`; (5) escribe el informe con `informe({ dir: $base, herramienta })` en `${FLUCASTR_RESULTADOS:-pruebas/resultados}/$(date +%F)-excedido-<herramienta>.md`. Un fallo de un lanzador no aborta (se mide igual); salida 0 si se escribió el informe, 2 si no.
- Los prompts son literales y no se ajustan: etapa 1 `Continúa con el flujo.`; etapa 2 `A`.
- La opción D aún no existe: el informe de la corrida de hoy mide la línea base (qué letras y si aplica A) y el de después de task-04 mide el cambio. Un mismo script sirve a ambos.
- Pruebas (4, en `correr-excedido.test.mjs`): (a) `bash -n` válido; (b) sin argumento sale 2; (c) con `FLUCASTR_CLAUDE_BIN` simulado que, si su último argumento es `A`, añade `; amp_arq=1` a `Presupuesto:` de `definitions/STATUS.md` y emite un evento `{"type":"result","result":"Listo."}`, con `FLUCASTR_SIN_PRECONDICION=1` y `FLUCASTR_RESULTADOS` en `pruebas/.temporales/`, sale 0 y el informe contiene `Veredicto: OK`; (d) igual con `pi` y `FLUCASTR_PI_BIN` simulado que no cambia nada: sale 0 y el informe contiene `Veredicto: FALLA`.
- `pruebas/README.md`: añade una viñeta tras la de «Corridas del `coordinador` (F12…)»: «Excedido + «A» (F36): `bash pruebas/correr-excedido.sh {claude-code|pi}`; solo con pedido de Franco; informe en `pruebas/resultados/`».

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: script, sus 4 pruebas y la viñeta del README.
Fuera de alcance: cambiar reglas (`skills/`, `agentes/`), el comprobador (task-01) y **la corrida real con modelo**: es paso manual de Franco (cuesta tokens y requiere sus credenciales): `bash pruebas/correr-excedido.sh pi` y `bash pruebas/correr-excedido.sh claude-code`, antes de aprobar task-03, y dejar los dos informes en `pruebas/resultados/`. Si Franco no los corre, task-03 sigue siendo válida; el informe «antes» quedará ausente.

## Pasos
1. Crea `pruebas/correr-excedido.sh` (ejecutable, `set -euo pipefail`) con el orden descrito; el informe se genera con `node --input-type=module -e` importando `file://$RAIZ/pruebas/comprobaciones/excedido-resultado.mjs`.
2. Crea `pruebas/correr-excedido.test.mjs` con las 4 pruebas.
3. Añade la viñeta al README.
4. Corre la *Verificación*.

## Criterios de aceptación
1. `node --test pruebas/correr-excedido.test.mjs` da `ℹ tests 4` y `ℹ fail 0`.
2. `bash -n pruebas/correr-excedido.sh` sale 0 y `bash pruebas/correr-excedido.sh` sale 2.
3. `bash pruebas/rapida.sh` da `ℹ tests 715` (711 de task-01 más 4) y `ℹ fail 6` (ajenos).
4. `git status --short pruebas/resultados` no muestra archivos nuevos (las pruebas escriben en `.temporales`).

## Verificación
```
node --test pruebas/correr-excedido.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash -n pruebas/correr-excedido.sh; echo "exit $?"; bash pruebas/correr-excedido.sh 2>/dev/null; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
git status --short pruebas/resultados
```
Esperado: `ℹ tests 4` y `ℹ fail 0`; `exit 0` y `exit 2`; `ℹ tests 715` y `ℹ fail 6`; última salida vacía.
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ node --test pruebas/correr-excedido.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 4
ℹ fail 0
exit 0
$ bash -n pruebas/correr-excedido.sh; echo "exit $?"; bash pruebas/correr-excedido.sh 2>/dev/null; echo "exit $?"
exit 0
exit 2
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 715
ℹ fail 6
exit 0
$ git status --short pruebas/resultados
exit 0
```

## Notas
- Hueco menor 1: el comprobador de task-01 lee `etapa1/STATUS.md`, `etapa2/STATUS.md` y `etapa2.jsonl` del directorio; el script copia el STATUS de cada etapa a su subcarpeta tras su lanzador. La tarea no lo decía; lo deduje de `informe({ dir, herramienta })`.
- Hueco menor 2: los lanzadores se invocan con `bash "$lanzador"` (no depende del bit de ejecución) y la base de la corrida, `pruebas/.temporales/excedido-<herramienta>-<PID>`, se borra con `rm -rf` antes de crearse. `pruebas/.temporales/` ya está en `pruebas/.gitignore`.
- Verificación: se corrió tres veces en total (intentos=3). La primera pasada dio lo esperado. Una segunda ejecución de la misma batería se perdió por un error de redirección (`tee` a una ruta inexistente) sin capturar salida; la tercera es la que queda en *Evidencia*. Los `exit` de las líneas con `grep` son los del pipeline (0 con coincidencias). Excede el máximo de 2 pasadas; no cambia el resultado (todo igual a lo esperado).
- No se lanzó ninguna corrida con modelo real (`correr-excedido.sh pi|claude-code` queda para Franco).
- Pruebas: los modelos simulados viven en `pruebas/.temporales/falso-*` y las corridas escriben en `pruebas/.temporales/resultados-*`; ambos ignorados por git.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=3; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
