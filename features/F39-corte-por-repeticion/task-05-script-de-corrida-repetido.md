# task-05 — Script de corrida `correr-repetido.sh` (sin ejecutarla con modelo real)
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Crea `pruebas/correr-repetido.sh {claude-code|pi}`: arma el fixture de task-04, lanza el coordinador con el lanzador de F12 de la herramienta y escribe el informe. Las pruebas usan un modelo simulado; la corrida real es task-06.

## Contexto
- Tocar: `pruebas/correr-repetido.sh`, `pruebas/correr-repetido.test.mjs`, `pruebas/README.md`
- Patrón: `pruebas/correr-excedido.sh` (precondición `node pruebas/comprobaciones/modelos-agentes.mjs` salvo `FLUCASTR_SIN_PRECONDICION=1`; lanzadores `pruebas/lanzar-coordinador-claude.sh` y `pruebas/lanzar-coordinador-pi.sh`, que exigen `FLUCASTR_RECORD_FILE`, un argumento y cwd = fixture; binarios `FLUCASTR_CLAUDE_BIN`, `FLUCASTR_PI_BIN`) y `pruebas/correr-excedido.test.mjs` (modelos simulados).
- De `depende_de:` lee solo las *Notas* de task-04 (`analizarCorrida`, prompt, rutas).
- `pruebas/README.md` línea 15: viñeta «Excedido + «A» (F36)…».
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Especificación: viñeta «Alcance de F37–F39 (Franco, 2026-11-04)», parte F39.
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Uso `bash pruebas/correr-repetido.sh {claude-code|pi}`; otro valor o ninguno: uso en stderr y salida 2. Una sola corrida y una sola etapa, con el prompt de task-04. Base `pruebas/.temporales/repetido-<herramienta>-<PID>`; copia el `STATUS.md` final a `$base/final/STATUS.md` y deja el registro en `$base/registro.jsonl`.
- Informe `${FLUCASTR_RESULTADOS:-pruebas/resultados}/$(date +%F)-repetido-<herramienta>-<k>.md` (primer `k` libre). Un fallo del lanzador no aborta. Imprime `informe: <ruta>` y `Veredicto: OK|FALLA`; sale 0 si escribió el informe, 2 si no.
- Pruebas (3): (a) `bash -n`; (b) sin argumento sale 2; (c) con binario simulado que reescribe `definitions/STATUS.md` del cwd con `Escalación: esta causa se repite. C) cerrar y revisar a mano | D) cerrar incompleta` sale 0 y el informe dice `Veredicto: OK`; y con uno que no cambia nada, `Veredicto: FALLA`.
- README: viñeta nueva tras la de F36 con `bash pruebas/correr-repetido.sh {claude-code|pi}`; solo con pedido de Franco.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: script, 3 pruebas y una viñeta.
Fuera de alcance: modelo real (task-06), editar lanzadores o `correr-excedido.sh`.

## Pasos
1. Corre `git branch --show-current`.
2. Escribe el script copiando el patrón.
3. Escribe las pruebas y la viñeta del README.

## Criterios de aceptación
1. Sin argumento sale 2 (prueba b).
2. Con modelo simulado correcto el informe dice `Veredicto: OK`; con uno inerte, `FALLA` (prueba c).
3. No se ejecuta ningún modelo real.

## Verificación
```
git branch --show-current
node --test pruebas/correr-repetido.test.mjs
bash -n pruebas/correr-repetido.sh
```
Esperado: rama `feature/F39-corte-por-repeticion`; prueba con 0 fallos; `bash -n` sin salida.

## Evidencia

```
$ git branch --show-current
feature/F39-corte-por-repeticion
exit 0
```

```
$ node --test pruebas/correr-repetido.test.mjs
✔ correr-repetido.sh: sintaxis Bash válida
✔ correr-repetido.sh: sin argumento sale 2
✔ correr-repetido.sh claude-code: modelo simulado correcto da Veredicto: OK
✔ correr-repetido.sh claude-code: modelo simulado inerte da Veredicto: FALLA
ℹ tests 4
ℹ pass 4
ℹ fail 0
exit 0
```

```
$ bash -n pruebas/correr-repetido.sh

exit 0
```

## Notas
- Hueco menor: la prueba (c) se separó en dos casos (modelo correcto → OK; modelo inerte → FALLA), por eso son 4 pruebas y no 3.
- Hueco menor: el prompt de la corrida es el de task-04 («La puerta previa volvió a rechazar features/F01-demo/task-01-rota.md. Continúa con el flujo.»); el script lo pasa tal cual al lanzador.
- Hueco menor: la precondición `modelos-agentes.mjs` se copió del patrón de `correr-excedido.sh`, salvo `FLUCASTR_SIN_PRECONDICION=1`. Ningún modelo real se ejecutó.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
