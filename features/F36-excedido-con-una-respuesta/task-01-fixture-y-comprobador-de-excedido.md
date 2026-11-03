# task-01 — Fixture y comprobador de la prueba de «excedido» + «A»
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Primera pieza de la prueba controlada con modelo real (patrón F12): un fixture con una feature en `estado=excedido` por `arq` (3 de 2) y un comprobador que, a partir del `STATUS.md` y del registro de una corrida, dice si el coordinador (1) escribió la *Escalación* con opciones por letra y (2) ante la respuesta «A» amplió el tope (`amp_arq>=1`) sin negarse. Todo es automático, sin modelo ni red; la corrida real es la task-02 más un paso manual de Franco. Solo MIDE.

## Contexto
- Tocar: `pruebas/fixtures/excedido.sh`, `pruebas/comprobaciones/excedido-resultado.mjs`, `pruebas/comprobaciones/excedido-resultado.test.mjs`
- Modelo a imitar: `pruebas/fixtures/coordinador.sh` (usa `source "$ROOT/_comun.sh"` y `inicializar_repo "$out" 'Nombre' ''`, que crea repo git en `main` con dos commits) y `pruebas/comprobaciones/coordinador-ejecucion.test.mjs` (registros sintéticos; fixture lanzado con `spawnSync`).
- `analyzeRecord(source, tool, canary)` de `pruebas/comprobaciones/registro.mjs` (línea 69) devuelve `{ model, finalText, ... }`; `tool` es `claude-code` o `pi`.
- `node scripts/validar-tarea.mjs --presupuesto features/F01-demo` (cwd = fixture) imprime `Presupuesto F01: D=4/8; ...; rondas arq=3/2 plan=1/3; estado=excedido arq` y sale 1 (medido con este STATUS.md); con `; amp_arq=1` tras `ampliado=0` imprime `D=4/9 ... arq=3/3 ... estado=ok` y sale 0 (medido).
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- `excedido.sh DIRECTORIO` (sin canario ni `.env`): `inicializar_repo "$out" 'Demo excedido' ''`; `git switch -c fix/F01-demo` dentro del fixture (es un repo temporal); crea `features/F01-demo/task-01-base.md` (`repo: demo   depende_de: —   estado: hecha`) y `task-02-segunda.md` (`estado: bloqueada`), cada una con título `# task-NN — …`; `definitions/BACKLOG.md` mínimo con F01 `pendiente` en la columna de siguiente (`→`) y F02 `pendiente`; `definitions/STATUS.md` exactamente: `# Estado` / `Escalación: ninguna` / `Paso actual: coordinador; F01; task-02; Rama: fix/F01-demo; Franco revisa la tarea bloqueada` / `Presupuesto: F01; rondas arq=3 plan=1; ampliado=0` / `Espera a Franco: ninguna` / `Bloqueos abiertos: task-02 bloqueada; rol=arquitecto` / `Retomar: F01; replantear task-02; fix/F01-demo; nada` / `Actualizado: 2026-11-03`. Commit final `fixture excedido`.
- Exporta de `excedido-resultado.mjs`: `letrasDeEscalacion(status)` → arreglo ordenado de letras `A`–`D` halladas como `X)` en la línea `Escalación:`; `ampArq(status)` → entero del sufijo `amp_arq=` de la línea `Presupuesto:` (0 si no está); `RECHAZO` = `/no corresponde|eludir|no puedo ampliar/i`; `evaluar({ etapa1, etapa2, herramienta, registro2 })` → `{ ok, hallazgos }` donde `etapa1` es el `STATUS.md` tras «Continúa…», `etapa2` el de tras «A» y `registro2` el texto del registro de la etapa 2. `ok` es verdadero solo si `etapa2` tiene `ampArq>=1` y el texto final (`analyzeRecord(...).finalText`) no coincide con `RECHAZO`. `hallazgos` lista, en español: letras de la etapa 1 (informativo), `amp_arq` de la etapa 2, modelo y si hubo rechazo.
- Exporta también `informe({ dir, herramienta })` → texto Markdown con título `# Excedido + «A» — <herramienta>`, líneas `Modelo: …`, `Letras en la Escalación: …`, `amp_arq tras «A»: …`, `Estado de --presupuesto tras «A»: …` (corre el validador del repo en `dir`), `Texto final: …` (≤300 caracteres) y `Veredicto: OK` o `Veredicto: FALLA`. `dir` contiene `etapa1/STATUS.md`, `etapa2/STATUS.md`, `etapa2.jsonl` y `fixture/` (la task-02 los deja así).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: fixture, comprobador y sus pruebas.
Fuera de alcance: lanzar un modelo, el script de corrida y el README (task-02), cualquier cambio a reglas, `skills/`, `agentes/`, `scripts/`, `definitions/`.

## Pasos
1. Crea `pruebas/fixtures/excedido.sh` (ejecutable, `set -euo pipefail`, uso `excedido.sh DIRECTORIO`) con el contenido descrito. Resultado: correrlo en un directorio vacío deja el repo con rama `fix/F01-demo`.
2. Crea `pruebas/comprobaciones/excedido-resultado.mjs` con las exportaciones descritas.
3. Crea `excedido-resultado.test.mjs` con 9 pruebas: (a) el fixture da `estado=excedido arq` y sale 1; (b) tras añadir `; amp_arq=1` da `estado=ok` y sale 0; (c) `letrasDeEscalacion` halla A y C en una línea con `A) … C) …`; (d) devuelve `[]` con `Escalación: ninguna`; (e) `ampArq` lee 1 y 0; (f) `evaluar` ok con `amp_arq=1` y texto final «Listo»; (g) `evaluar` falla con `amp_arq=1` y texto «no corresponde ampliar topes»; (h) `evaluar` falla sin `amp_arq`; (i) `informe` contiene `Veredicto: OK` con un `dir` armado a mano en `pruebas/.temporales/` y registro Claude sintético.
4. Corre la *Verificación*.

## Criterios de aceptación
1. `bash pruebas/fixtures/excedido.sh pruebas/.temporales/excedido-t01` sale 0 y `git -C pruebas/.temporales/excedido-t01 branch --show-current` imprime `fix/F01-demo`.
2. `node --test pruebas/comprobaciones/excedido-resultado.test.mjs` da `ℹ tests 9` y `ℹ fail 0`.
3. `bash pruebas/rapida.sh` da `ℹ fail 6` (los mismos ajenos de hoy) y `ℹ tests 711` (702 medidos hoy más 9).

## Verificación
```
rm -rf pruebas/.temporales/excedido-t01; bash pruebas/fixtures/excedido.sh pruebas/.temporales/excedido-t01; git -C pruebas/.temporales/excedido-t01 branch --show-current
node --test pruebas/comprobaciones/excedido-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `fix/F01-demo`; `ℹ tests 9` y `ℹ fail 0`; `ℹ tests 711` y `ℹ fail 6` (la rápida sale 1 mientras haya fallos conocidos: no se exige salida 0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia

```
$ rm -rf pruebas/.temporales/excedido-t01; bash pruebas/fixtures/excedido.sh pruebas/.temporales/excedido-t01; git -C pruebas/.temporales/excedido-t01 branch --show-current
fix/F01-demo
exit 0
$ node --test pruebas/comprobaciones/excedido-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 9
ℹ fail 0
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 711
ℹ fail 6
exit 1
```

## Notas
- Hueco menor 1: `scripts/validar-tarea.mjs` importa transitivamente `formato-bloqueo.mjs` y `formato-requiere.mjs`; el fixture los copia además de los cuatro `formato-*` previstos. Sin ellos el validador no arranca.
- Hueco menor 2: el fixture hace `git -C <dir> switch -qc fix/F01-demo` (equivale al `git switch -c` de la tarea, ejecutado sobre el repo temporal).
- Hueco menor 3: `letrasDeEscalacion` lee la línea `Escalación:` de la etapa 1, que es el STATUS que contiene las opciones.
- Verificación: 2 pasadas (la primera tras corregir los imports del fixture; la segunda para capturar la Evidencia). Pasada 1 y 2 coinciden: `ℹ fail 6` en la rápida son los fallos ajenos conocidos; no se comprobó que sean los mismos seis por nombre, solo el recuento.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
