# task-01 — Módulo puro formato-presupuesto.mjs con su prueba
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Crea `scripts/formato-presupuesto.mjs`, un módulo puro (sin disco, sin red) que valida el `STATUS.md` compacto y calcula la línea de presupuesto de una feature. La opción `--presupuesto` de `validar-tarea.mjs` lo usará en task-02; aquí solo se crea el módulo y su prueba, sin tocar el CLI.

## Contexto
- Tocar: `scripts/formato-presupuesto.mjs`, `pruebas/comprobaciones/formato-presupuesto.test.mjs`
- Fuente: definitions/CONSUMO.md «(b) Presupuesto por feature»
- Modelo de estilo: `scripts/formato-fuente.mjs` (función pura, motivos en español, `[]` = válido). Las líneas `Registro:` de una tarea tienen la forma `Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna` (`scripts/formato-evidencia.mjs`, `RE_REGISTRO`).
- Pruebas: `node:test` y `node:assert/strict`, como `pruebas/comprobaciones/topes-bytes.test.mjs`.

## Decisiones ya tomadas
- Exports: `TOPE_STATUS = 1536`; `validarStatusCompacto(texto)`; `calcularPresupuesto({ feature, tareas, status })` con `tareas` = arreglo de textos de tarea y `status` = texto de `STATUS.md`; devuelve `{ linea, estado, causas }`.
- `validarStatusCompacto` devuelve motivos; vacío = válido. Reglas: tamaño en bytes (`Buffer.byteLength`) ≤ 1536; línea 1 exacta `# Estado`; luego, en este orden y sin líneas extra, las siete que empiezan por `Escalación: `, `Paso actual: `, `Presupuesto: `, `Espera a Franco: `, `Bloqueos abiertos: `, `Retomar: `, `Actualizado: ` (un motivo por línea faltante o fuera de lugar); el valor de cada línea no vacío y cada ítem (valor partido por ` | `) ≤ 150 caracteres; `Espera a Franco` y `Bloqueos abiertos` con ≤ 3 ítems; `Presupuesto:` con la forma `Presupuesto: <Fxx|ninguna>; rondas arq=<n> plan=<n>; ampliado=<n>`.
- `calcularPresupuesto`: `T` = `tareas.length`; `E` = líneas que empiezan por `Registro:`; `I` = suma de `intentos=`; `K` = tareas cuya última línea `Registro:` tiene `resultado=` distinto de `lista`; `arq`, `plan`, `ampliado` salen de la línea `Presupuesto:` solo si su feature coincide con `feature` (si no, 0, 0 y 0); `D = E + arq + plan`; tope de `D` = `2·T + 4 + ampliado`.
- `estado=excedido` si `D` > tope, `K` > 2, `arq` > 2 o `plan` > 3; causas `D`, `K`, `arq`, `plan` unidas con `+`. Si no, `estado=aviso` cuando `D·4 ≥ tope·3` (causa `D75`) o `K` = 2 (causa `K2`); si no, `estado=ok`.
- `linea` exacta: `Presupuesto F29: D=7/24; E=5; I=6; K=1/2; rondas arq=1/2 plan=1/3; estado=ok` (con causa: `estado=excedido D+K`, `estado=aviso D75`).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un módulo nuevo y su prueba.
Fuera de alcance: `validar-tarea.mjs` (task-02), `formato-flujo.mjs` (task-03), los agentes, las skills y todo lo de `definitions/`.

## Pasos
1. Crea `scripts/formato-presupuesto.mjs` con los tres exports según «Decisiones ya tomadas».
2. Crea `pruebas/comprobaciones/formato-presupuesto.test.mjs` con textos sintéticos (no lee `definitions/` ni `features/`): casos `ok`, `aviso` por `D75`, `aviso` por `K2`, `excedido` por `D`, por `K` (3), por `arq` (3) y por `plan` (4), y `ampliado` que sube el tope.
3. Controles negativos de `validarStatusCompacto`: un `STATUS.md` sintético de exactamente 1536 B es válido y de 1537 B no; falta una línea; dos líneas en orden cambiado; un ítem de 151 caracteres; `Presupuesto:` mal formada.
4. Corre la prueba.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/formato-presupuesto.test.mjs` da `ℹ fail 0` y al menos 12 pruebas.
2. Un `STATUS.md` compacto de 1537 B devuelve un motivo con `1536`; el de 1536 B, `[]`.
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (ajenos).

## Verificación
```
node --test pruebas/comprobaciones/formato-presupuesto.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
node -e 'import("./scripts/formato-presupuesto.mjs").then(m=>console.log(m.TOPE_STATUS, m.calcularPresupuesto({feature:"F29",tareas:[],status:""}).linea))'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primero; `1536 Presupuesto F29: D=0/4` en el segundo; `ℹ fail 7` en el tercero.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-presupuesto.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
ℹ pass 20
ℹ fail 0
exit 0
```

```
$ node -e 'import("./scripts/formato-presupuesto.mjs").then(m=>console.log(m.TOPE_STATUS, m.calcularPresupuesto({feature:"F29",tareas:[],status:""}).linea))'; echo "exit $?"
1536 Presupuesto F29: D=0/4; E=0; I=0; K=0/2; rondas arq=0/2 plan=0/3; estado=ok
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
Creados `scripts/formato-presupuesto.mjs` y `pruebas/comprobaciones/formato-presupuesto.test.mjs` según «Decisiones ya tomadas»; el CLI no se tocó.
Huecos menores: (1) una tarea cuya última `Registro:` no tiene `resultado=` no cuenta en `K` (decisión conservadora); (2) varias causas de `aviso` se unen con `+` (p. ej. `D75+K2`), igual que en `excedido`.
Los controles negativos de la tarea (1537 B, falta de línea, orden cambiado, ítem de 151, `Presupuesto:` mal formada) están en la prueba.
Autocomprobación final: `node scripts/validar-tarea.mjs --evidencia` sale 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
