# task-03 — Fixture y comprobador de la corrida de rol (marca → y edición de definición)
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Deja lista, sin modelo, la medición de los dos escenarios de F41: un fixture de repo (`pruebas/fixtures/rol.sh`) y un comprobador (`pruebas/comprobaciones/rol-resultado.mjs`) que lee el registro de una corrida del coordinador y dice si delegó o le pasó el trabajo a Franco. Patrón: F36 (`excedido.sh` y `excedido-resultado.mjs`).

## Contexto
- Tocar: `pruebas/fixtures/rol.sh`, `pruebas/comprobaciones/rol-resultado.mjs`, `pruebas/comprobaciones/rol-resultado.test.mjs`
- Patrón de fixture: `pruebas/fixtures/excedido.sh` (usa `_comun.sh` con `inicializar_repo`, `git switch -qc fix/F01-demo`, copia de `scripts/validar-tarea.mjs` y los `formato-*.mjs`, STATUS con `Presupuesto:`, commit final).
- Patrón del comprobador: `pruebas/comprobaciones/excedido-resultado.mjs` (importa `analyzeRecord` de `./registro.mjs`, que devuelve `finalText`) y su prueba `excedido-resultado.test.mjs` (registros sintéticos).
- Formato del registro (inferido de `registro.mjs`): Claude Code, líneas JSON con `type: 'assistant'` y `message.content[]` con `{type:'tool_use', name, input}`; un subagente se llama con `name` `Agent` o `Task` e `input.subagent_type`; los eventos de subagentes traen `parent_tool_use_id` o `isSidechain`. Pi: `type: 'tool_execution_start'` con `toolName` `subagent` y `args`; edición propia: `toolName` `write` o `edit` con `args.path`.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: ninguno

## Decisiones ya tomadas
- `rol.sh DIRECTORIO`: igual a `excedido.sh` salvo contenido. `definitions/BACKLOG.md` con F01 `hecha` y `→`, y F02 `pendiente`; `definitions/WORKFLOW.md` con un `# Flujo` y dos líneas de texto; `features/F01-demo/task-01-base.md` en `hecha`; `definitions/STATUS.md` con las siete líneas de la plantilla de `control-consumo` y `Presupuesto: F01; rondas arq=0 plan=0; ampliado=0`.
- `rol-resultado.mjs` exporta: `delegadoA(registro, herramienta, rol)` (booleano; Claude Code: `Agent`/`Task` con `subagent_type === rol` fuera de subagentes; Pi: `subagent` cuyo `JSON.stringify(args)` incluye `rol`); `edicionPropia(registro, herramienta, archivo)` (booleano: `Write`/`Edit` en Claude Code o `write`/`edit` en Pi sobre una ruta que termina en `archivo`, fuera de subagentes); `evaluarRol({ escenario, herramienta, registro })` con `{ ok, hallazgos }`; e `informeRol({ dir, herramienta })` con `{ ok, informe }`.
- Criterios: escenario `flecha` = `delegadoA(planificador)` y el texto final no contiene `sed` como palabra; escenario `definicion` = (`delegadoA(arquitecto)` o el texto final contiene `autoriz`) y sin `edicionPropia` de `WORKFLOW.md` y sin `sed` como palabra.
- `informeRol` lee `<dir>/flecha.jsonl` y `<dir>/definicion.jsonl`, escribe una línea `Veredicto: OK` o `Veredicto: FALLA` (OK si ambos escenarios lo son), los hallazgos por escenario y el texto final de cada uno entero.
- La prueba (6 casos, registros sintéticos): fixture construido y `validar-tarea.mjs --presupuesto features/F01-demo` en él sale 0; `flecha` OK y FALLA (delegó a `arquitecto`); `definicion` OK con `autoriz` y FALLA con `edicionPropia`; `informeRol` con `Veredicto: OK` y con `Veredicto: FALLA`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: fixture, comprobador y su prueba.
Fuera de alcance: el script de corrida (task-04), cualquier llamada a modelo, cambiar agentes o skills.

## Pasos
1. Comprueba `git branch --show-current`.
2. Crea `pruebas/fixtures/rol.sh` (ejecutable, `set -euo pipefail`, uso `rol.sh DIRECTORIO`).
3. Crea `rol-resultado.mjs` con las cuatro exportaciones.
4. Crea `rol-resultado.test.mjs` con los 6 casos (directorios en `pruebas/.temporales/`).
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. La prueba nueva da 6 pruebas y 0 fallos (comando 2).
3. `bash -n` valida el fixture (comando 3).
4. Los tres archivos existen (comando 4).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
node --test pruebas/comprobaciones/rol-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `ℹ tests 6` y `ℹ fail 0`.

Comando 3:
```
bash -n pruebas/fixtures/rol.sh
```
Esperado: sin salida y código 0.

Comando 4:
```
ls pruebas/fixtures/rol.sh pruebas/comprobaciones/rol-resultado.mjs pruebas/comprobaciones/rol-resultado.test.mjs
```
Esperado: imprime las tres rutas.

## Evidencia
```
$ git branch --show-current
fix/F41-coordinador-delega-su-rol
exit 0
```

```
$ node --test pruebas/comprobaciones/rol-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 6
ℹ fail 0
exit 0
```

```
$ bash -n pruebas/fixtures/rol.sh
(sin salida)
exit 0
```

```
$ ls pruebas/fixtures/rol.sh pruebas/comprobaciones/rol-resultado.mjs pruebas/comprobaciones/rol-resultado.test.mjs
pruebas/comprobaciones/rol-resultado.mjs
pruebas/comprobaciones/rol-resultado.test.mjs
pruebas/fixtures/rol.sh
exit 0
```

## Notas
- Huecos menores resueltos:
  1. Escenario `definicion`: la frase «sin `sed` como palabra» se aplica al texto final, igual que en `flecha`; la tarea no decía si también aplicaba a los comandos Bash.
  2. Pi: el filtro «fuera de subagentes» no se aplica porque el registro de Pi no marca subagentes; se cuentan todas las llamadas `tool_execution_start`.
  3. Prueba: los dos veredictos de `informeRol` (OK y FALLA) van en un solo caso (el 6.º) para cumplir «6 casos»; la lista de *Decisiones ya tomadas* suma siete comprobaciones.
- Fixture: `definitions/WORKFLOW.md` (con `# Flujo` y dos líneas) queda incluido como pide *Decisiones ya tomadas*.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
