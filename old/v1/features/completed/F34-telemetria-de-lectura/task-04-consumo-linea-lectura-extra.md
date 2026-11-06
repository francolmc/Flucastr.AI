# task-04 — consumo.mjs: resumen y línea «lecturas extra» en el informe de texto
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Con `lecturaExtra` por corrida disponible, `consumo.mjs` expone `resumenLecturaExtra(corridas)` (cuenta y cumplimiento) y lo imprime como una línea por sesión en el informe de texto. `informe.mjs` (task-06) reutiliza la función.

## Contexto
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-03.
- `scripts/consumo.mjs` (leído): `lineasDeSesion(s, tareas)` (línea 649) arma las líneas; la línea `KB leídos por categoría:` está en la 678. `s.subagentes.corridas` trae las corridas.
- `consumo.test.mjs`: `cli (1)` (línea 695) verifica con `includes`, no con igualdad total; `cli (2)` comprueba una línea exacta de definitions y «ninguno». `ℹ tests` previo: 60.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- `export function resumenLecturaExtra(corridas)` devuelve `{ corridas: n, extras: Σ extras.length, declaradas: Σ declaradas, cumplimiento, porLlamada }`. `cumplimiento` = `Math.round(declaradas*100/extras)` (entero, %) o `null` si `extras` es 0; `porLlamada` = `Math.round(extras/n*10)/10` o `null` si `n` es 0. Una corrida sin campo `lecturaExtra` cuenta como 0 extras.
- Línea nueva, justo antes de `KB leídos por categoría:`: `lecturas extra: <extras> en <n> corrida(s); declaradas <declaradas>; cumplimiento <p> %` con `n/d` en lugar de `<p> %` si `cumplimiento` es `null`. Se imprime siempre (con 0 en sesiones sin subagentes).
- `informeJson` de consumo no cambia: ya lleva `subagentes.corridas`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `resumenLecturaExtra`, la línea y 2 pruebas.
Fuera de alcance: `informe.mjs`, `pistas.mjs`, JSON nuevo.

## Pasos
1. En `consumo.mjs` agrega y exporta `resumenLecturaExtra`; añade la línea en `lineasDeSesion`.
2. En `consumo.test.mjs` agrega 2 pruebas: (a) `resumenLecturaExtra` con 3 corridas (extras 2/declaradas 1, extras 0, sin campo) → `{ corridas: 3, extras: 2, declaradas: 1, cumplimiento: 50, porLlamada: 0.7 }`, y con `[]` → `cumplimiento: null`, `porLlamada: null`; (b) CLI `--raiz` sobre una sesión Pi sintética con un subagente con una lectura extra declarada (como en task-02) imprime `lecturas extra: 1 en 1 corrida(s); declaradas 1; cumplimiento 100 %`, y sin subagentes imprime `lecturas extra: 0 en 0 corrida(s); declaradas 0; cumplimiento n/d`.
3. Corre la verificación.

## Criterios de aceptación
1. Los números de la prueba (a) coinciden exactamente.
2. La línea sale en ambos casos de la prueba (b).
3. Las 60 pruebas previas siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 62`, `ℹ pass 62`, `ℹ fail 0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 62
ℹ pass 62
ℹ fail 0
exit 0
```

## Notas

- Pasos 1 y 2 hechos en `scripts/consumo.mjs` (`resumenLecturaExtra` exportada y línea `lecturas extra:` antes de `KB leídos por categoría:`) y en `pruebas/comprobaciones/consumo.test.mjs` (import y 2 pruebas al final).
- Sin huecos menores. Verificación pasada a la primera pasada (62/62).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
