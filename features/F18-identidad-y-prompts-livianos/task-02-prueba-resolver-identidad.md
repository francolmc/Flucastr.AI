# task-02 — Prueba de la línea de identidad en `resolver-agentes.test.mjs`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Ajustar y ampliar `pruebas/comprobaciones/resolver-agentes.test.mjs` para la línea de identidad de task-01: las dos pruebas que comparan Pi con Claude Code «salvo `model:`» deben ignorar también la línea `Herramienta:` (difiere por herramienta), y tres pruebas nuevas, sin modelo, la exigen en `agente-claude`, `agente-pi` y `cuerpo`, con control negativo.

## Contexto
- Leído `pruebas/comprobaciones/resolver-agentes.test.mjs` (7 pruebas): el ayudante `sinLineaModelo(salida)` filtra las líneas que empiezan por `model:`; lo usan la prueba (3) (agente sin Bash) y la (6) (arquitecto, planificador y constructor); `resolver(...args)` ejecuta `node scripts/resolver.mjs`; `agenteTemporal(nombre, tools)` crea un agente temporal; `RAIZ_REPO` es la raíz; la prueba (7) instala en una copia aislada (`HOME` y `PI_CODING_AGENT_DIR` temporales) y lee `coordinador.md` instalado de Claude Code y de Pi.
- Pasan hoy por el glob de `pruebas/rapida.sh` (`pruebas/comprobaciones/*.test.mjs`); no hay que editar `rapida.sh`.
- Valores esperados se derivan con `resolver('modelo', agente, herramienta)`, no se fijan a mano, para que la prueba no dependa de qué modelo tenga `modelos.json`.
- Se ejecuta con `node --test pruebas/comprobaciones/resolver-agentes.test.mjs`.
- Nota: el `BACKLOG.md` cita la ruta `pruebas/resolver-agentes.test.mjs`; la real (leída) es `pruebas/comprobaciones/resolver-agentes.test.mjs`.

## Decisiones ya tomadas
- `sinLineaModelo` pasa a filtrar `model:` y `Herramienta:` (mismo nombre, para no tocar los llamadores).
- Pruebas nuevas, con estos nombres (en español) y numeración continua tras la (7):
  - `(8) agente-claude y agente-pi ponen la línea de identidad justo después del encabezado`: para `coordinador` y `constructor` reales (`agentes/`), la línea que sigue al segundo `---` es exactamente `Herramienta: Claude Code | Modelo: <resolver modelo X claude-code> | Agente: X` en `agente-claude` y `Herramienta: Pi | Modelo: <resolver modelo X pi> | Agente: X` en `agente-pi`.
  - `(9) cuerpo empieza con la línea de identidad de Pi seguida de una línea en blanco`: para `coordinador` y `constructor`, las dos primeras líneas de `resolver('cuerpo', ruta)` son la línea de Pi (modelo de `resolver modelo X pi`) y una cadena vacía.
  - `(10) control negativo: sin filtrar Herramienta: las salidas de Pi y Claude Code difieren`: para un agente temporal (sin Bash), quitando solo las líneas `model:` las salidas de `agente-pi` y `agente-claude` NO son iguales (`assert.notEqual`), con lo cual el filtro de `sinLineaModelo` es necesario.
- Además, en la prueba (7) (instalación aislada) se agrega: el `coordinador.md` instalado de Claude Code contiene la línea de identidad de Claude Code y el de Pi la de Pi (`includes`, con el modelo derivado de `resolver modelo coordinador <herramienta>` ejecutado sin `FLUCASTR_MODELOS`).
- Sin red, sin modelo, sin tocar `~/.claude`, `~/.pi` ni `~/.flucastr-ai`.

## Alcance / Fuera de alcance
Alcance: `pruebas/comprobaciones/resolver-agentes.test.mjs`.
Fuera de alcance: `scripts/resolver.mjs` (task-01), `pruebas/rapida.sh`, otros comprobadores, `BACKLOG.md`, la prueba de higiene de contexto (task-06).

## Pasos
1. Ajustar `sinLineaModelo` para ignorar también `Herramienta:`. Resultado: las pruebas (3) y (6) siguen en verde con la salida de task-01.
2. Agregar las pruebas (8), (9) y (10). Resultado: el archivo carga y las pruebas pasan.
3. Agregar las dos aserciones a la prueba (7). Resultado: la prueba (7) pasa.
4. Control: confirmar que la prueba (10) falla si se quita la línea `Herramienta:` de `resolver.mjs` (se comprueba comentando temporalmente la línea en una copia en el directorio temporal del sistema, no en el repo; anotar el resultado en *Notas*). Resultado: documentado en *Notas*.
5. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/resolver-agentes.test.mjs` termina con `pass 10` y `fail 0`.
2. La prueba (9) cubre `cuerpo` (el camino de los lanzadores `pi-*`): se comprueba leyendo que `resolver('cuerpo', …)` es lo que examina.
3. `git status --short` muestra como cambiado, de esta tarea, solo `pruebas/comprobaciones/resolver-agentes.test.mjs`.
4. `bash pruebas/rapida.sh` termina con exit 0 y la línea `rapida: N archivos en S s (tope 30 s)`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/resolver-agentes.test.mjs
git status --short pruebas/
bash pruebas/rapida.sh | tail -1
```
Esperado: `pass 10`, `fail 0`; solo ese archivo de pruebas modificado por esta tarea; última línea `rapida: … (tope 30 s)`. Si `rapida.sh` supera 30 s por carga ajena a la tarea (riesgo abierto en `STATUS.md`), repetir una vez y anotarlo en *Notas*, sin tocar `rapida.sh`. No ejecutado por el planificador tras el cambio.

## Evidencia

Rama: `git branch --show-current` → `feature/F18-identidad-y-prompts-livianos` (no se hizo switch; ya era la actual).

Cambios en `pruebas/comprobaciones/resolver-agentes.test.mjs`: `sinLineaModelo` filtra también `Herramienta:`; helper nuevo `resolverEn(raiz, ...args)` (sin `FLUCASTR_MODELOS`); aserciones de identidad en la prueba (7); pruebas nuevas (8), (9) y (10).

Comando: `node --test pruebas/comprobaciones/resolver-agentes.test.mjs`
```
✔ (1) agente-pi reduce Bash(...) a Bash y conserva el resto de tools (32.839041ms)
✔ (2) agente-claude conserva los patrones de Bash (24.492083ms)
✔ (3) agente sin Bash queda idéntico en ambas salidas salvo model: (46.774917ms)
✔ (4) coordinador: agente-pi declara Bash sin patrones y conserva Agent, Read, Grep, Glob, Write, Edit, Skill (24.638916ms)
✔ (5) coordinador: agente-claude conserva los tres patrones Bash(...) (24.612292ms)
✔ (6) arquitecto, planificador y constructor no cambian en agente-pi (comparado con agente-claude sin model:) (142.453583ms)
✔ (7) instalación aislada: Claude Code conserva patrones y Pi declara Bash sin patrones (871.176334ms)
✔ (8) agente-claude y agente-pi ponen la línea de identidad justo después del encabezado (186.402334ms)
✔ (9) cuerpo empieza con la línea de identidad de Pi seguida de una línea en blanco (94.428042ms)
✔ (10) control negativo: sin filtrar Herramienta: las salidas de Pi y Claude Code difieren (50.400709ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Comando: `git status --short pruebas/`
```
 M pruebas/comprobaciones/resolver-agentes.test.mjs
?? pruebas/resultados/2026-10-31-sondeo-codex.md
?? pruebas/resultados/2026-10-31-sondeo-consumo-pi.md
?? pruebas/resultados/2026-10-31-verificacion-compactacion.md
```
(Los tres `??` de `pruebas/resultados/` son de otras tareas o sesiones, no de esta; esta tarea solo modificó el archivo de prueba.)

Control del paso 4 (en copia en el directorio temporal de la sesión, no en el repo): en la copia de `scripts/resolver.mjs` se quitó la línea de identidad de `agente-claude` y `agente-pi` (`---\n${lineaIdentidad(herramienta, agente)}\n${cuerpo}` → `---\n${cuerpo}`) y se corrió la suite de la copia. Resultado: la prueba (10) falla (`assert.notEqual`: las dos salidas quedan iguales), como se esperaba. Fallan también (7) y (8), que comprueban la línea que se quitó; (9) pasa porque `cuerpo` no cambió.
```
ℹ pass 7
ℹ fail 3
✖ (7) instalación aislada: Claude Code conserva patrones y Pi declara Bash sin patrones
✖ (8) agente-claude y agente-pi ponen la línea de identidad justo después del encabezado
✖ (10) control negativo: sin filtrar Herramienta: las salidas de Pi y Claude Code difieren
```

Verificación de `pruebas/rapida.sh` con el HOME real (`HOME=/Users/franco`), salida completa guardada en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/rapida-salida.txt`. Comando: `bash pruebas/rapida.sh`
```
ℹ tests 227
ℹ pass 227
ℹ fail 0
rapida: 22 archivos en 14 s (tope 30 s)
EXIT=0
```
Las dos pruebas que task-01 dejó en rojo, (3) y (6), pasan ahora.

Criterios de aceptación:
1. `node --test …` → `pass 10`, `fail 0`. Cumple.
2. La prueba (9) examina `resolver('cuerpo', …)` (líneas 1 y 2 de `cuerpo` para `coordinador` y `constructor`). Cumple.
3. Cambio de esta tarea: solo `pruebas/comprobaciones/resolver-agentes.test.mjs`. Cumple.
4. `bash pruebas/rapida.sh` exit 0 y `rapida: 22 archivos en 14 s (tope 30 s)`. Cumple.

## Notas
- Hueco menor 1: la tarea pedía que la prueba (7) derive el modelo sin `FLUCASTR_MODELOS`, pero el helper `resolver(...)` hereda el entorno. Se añadió el helper `resolverEn(raiz, ...args)`, que quita `FLUCASTR_MODELOS` y ejecuta el `resolver.mjs` de la raíz indicada (en la prueba (7), la copia instalada). Decisión conservadora, sin cambiar los llamadores de `resolver(...)`.
- `sinLineaModelo` conserva su nombre (lo usan (3) y (6)); solo cambia el filtro y el comentario.
- Las pruebas (8) y (9) derivan el modelo con `resolver('modelo', nombre, herramienta)`, no lo fijan a mano; la (10) usa un filtro local de `model:` para que el control negativo no dependa del filtro nuevo.
- Control del paso 4 hecho en copia en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/control-herramienta`, no en el repo. La copia queda en el scratchpad.
- No se reinstaló nada en `~/.claude` ni `~/.pi`; la prueba (7) instala solo en un HOME temporal. No se tocó `rapida.sh`, `scripts/resolver.mjs`, `STATUS.md` ni otras tareas. Sin commit, push, PR, merge ni despliegue.
- Franco debe revisar la *Evidencia* de esta tarea; `hecha` lo decide él.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
