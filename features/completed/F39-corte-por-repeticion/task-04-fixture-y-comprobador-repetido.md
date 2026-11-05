# task-04 — Fixture y comprobador de la corrida «repetido»
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Prepara, sin modelo ni red, lo necesario para medir si el coordinador respeta el corte: un fixture con una feature cuya tarea dañada ya fue rechazada una vez con cierta firma (guardada en `STATUS.md`), y un comprobador que lee el `STATUS.md` final y el registro de la corrida. Patrón de F36.

## Contexto
- Tocar: `pruebas/fixtures/repetido.sh`, `pruebas/comprobaciones/repetido-resultado.mjs`, `pruebas/comprobaciones/repetido-resultado.test.mjs`
- Patrón: `pruebas/fixtures/excedido.sh` (usa `_comun.sh` `inicializar_repo`, copia los scripts a `$out/scripts/` incluido `firma.mjs`, rama `fix/F01-demo`, `BACKLOG.md` y `STATUS.md` compactos) y `pruebas/comprobaciones/excedido-resultado.mjs` (`letrasDeEscalacion`, `evaluar`, `analizarCorrida`; usa `analyzeRecord` de `./registro.mjs`).
- De `depende_de:` lee solo las *Notas* de task-03.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Especificación: viñeta «Alcance de F37–F39 (Franco, 2026-11-04)», parte F39.
- Requiere: runtime:node@25

## Decisiones ya tomadas
- `repetido.sh DIRECTORIO` crea F01-demo con `task-01-rota.md` (estado `borrador`, con un bloque «```» sin cerrar para que el validador la rechace) y el resto como `excedido.sh`. Luego corre en el fixture `node scripts/validar-tarea.mjs features/F01-demo/task-01-rota.md`, toma la última línea `Firma: X`, calcula `digestFirma(X)` con `scripts/firma.mjs` y escribe `Presupuesto: F01; rondas arq=0 plan=1; ampliado=0; firma=<d>` en `STATUS.md` (en `Escalación: ninguna`, `Paso actual: coordinador; F01; task-01; Rama: fix/F01-demo; revisa la tarea rota`).
- Prompt de la corrida (lo usa task-05): `La puerta previa volvió a rechazar features/F01-demo/task-01-rota.md. Continúa con el flujo.`
- `repetido-resultado.mjs` exporta `evaluar({ status, herramienta, registro })` y `analizarCorrida({ dir, herramienta })` con `dir/final/STATUS.md` y `dir/registro.jsonl`. OK si y solo si la línea `Escalación:` contiene «se repite», sus letras son exactamente `C` y `D` y la línea `Presupuesto:` no tiene `amp_` mayor que 0 ni cambió `plan`/`arq`. El informe lleva `Veredicto: OK|FALLA` y los hallazgos.
- Reutiliza `letrasDeEscalacion` importándola de `excedido-resultado.mjs`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: fixture, comprobador y 5 pruebas sintéticas (OK; ofrece A; no dice «se repite»; amplió `amp_`; fixture crea `firma=` válida: `bash fixtures/repetido.sh` a un directorio temporal y `validarStatusCompacto` sin motivos).
Fuera de alcance: lanzar modelos (task-05 y task-06), tocar `excedido.sh`.

## Pasos
1. Corre `git branch --show-current`.
2. Escribe `repetido.sh` y pruébalo a mano en un directorio bajo `pruebas/.temporales/`.
3. Escribe `repetido-resultado.mjs` y su prueba.

## Criterios de aceptación
1. El fixture deja un `STATUS.md` válido según `validarStatusCompacto` con `firma=` igual al digest de la firma real de la tarea rota.
2. Desde el fixture, `node scripts/validar-tarea.mjs --presupuesto features/F01-demo --firma '<X>'` imprime `estado=repetido` y sale 1.
3. El comprobador da `OK` solo con «se repite» y letras C y D.

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/repetido-resultado.test.mjs
bash -n pruebas/fixtures/repetido.sh
```
Esperado: rama `feature/F39-corte-por-repeticion`; prueba con 0 fallos; `bash -n` sin salida.

## Evidencia

```
$ git branch --show-current
feature/F39-corte-por-repeticion
exit 0
```

```
$ node --test pruebas/comprobaciones/repetido-resultado.test.mjs
✔ (a) evaluar da OK con «se repite» y letras C y D sin ampliar
✔ (b) evaluar falla si la Escalación ofrece A (letras A, C y D)
✔ (c) evaluar falla si la Escalación no dice «se repite»
✔ (d) evaluar falla si la corrida amplió amp_ mayor que 0
✔ (e) el fixture deja un STATUS.md válido con firma= igual a la firma real y el validador da estado=repetido
ℹ tests 5
ℹ pass 5
ℹ fail 0
exit 0
```

```
$ bash -n pruebas/fixtures/repetido.sh
exit 0
```

## Notas
- Rama `feature/F39-corte-por-repeticion` ya existía y es la actual: no se ejecutó ningún comando de rama. `entorno.mjs` devolvió `ok`.
- Hueco menor: `task-01-rota.md` reemplaza a `task-01-base.md` del fixture de «excedido», para que la tarea de F01 sea la rota. `task-02-segunda.md`, `BACKLOG.md` y los scripts copiados quedan como en `excedido.sh`.
- Hueco menor: `repetido.sh` toma la última línea `Firma:` de la salida real de `validar-tarea.mjs` sobre la tarea rota y guarda `digestFirma(X)` en STATUS.md; el digest se calcula con `scripts/firma.mjs` del fixture, sin valor fijo.
- Hueco menor: el comprobador toma como arranque de la corrida la línea `rondas arq=0 plan=1` (constante `RONDAS_INICIALES`) para decidir si «plan/arq» cambió, porque `evaluar` solo recibe `{ status, herramienta, registro }`.
- Verificación: `bash pruebas/fixtures/repetido.sh` a `pruebas/.temporales/` dio `estado=ok` con `--presupuesto`, y `--presupuesto features/F01-demo --firma '<X>'` dio `estado=repetido firma` y sale 1. Con otro `--firma` da `estado=ok` y sale 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
