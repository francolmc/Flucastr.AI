# Banco de pruebas del builder

> **Aviso: la línea base del 2026-11-27 no sirve para decidir un A/B.** Tiene 0 DONE de 6 pares medidos, y al menos 4 de sus 8 pares se detuvieron por el banco o el entorno, no por el builder. Sus defectos están en la sección 6 («Límites»). Detalle y cifras: `changes/done/evals-builder/linea-base.md`. Este cambio se cierra en `changes/done/evals-builder/` (D-43).

Mide `kit run` sobre tramos históricos: calibra un corpus de tramos, corre una variante (contrato, nivel, esfuerzo o ventana) sobre ese corpus con una semilla fija, compara dos corridas pareadas y resume cada una. Todo se lanza con `bench.mjs`:

```sh
node evals/builder/bench.mjs <orden> [opciones]
```

Órdenes: `calibrar`, `correr` y `comparar`. Una orden desconocida sale con código 2.

## Antes de empezar

- **Fuera del sandbox.** La calibración real y `correr` necesitan Docker (reservas), Codex con su carpeta `~/.codex` (o `CODEX_HOME`) y los repos de tu mapa local. En el sandbox del builder `~/.codex` es de solo lectura y Docker no responde, así que estas órdenes se corren desde una terminal propia.
- **Mapa local.** `evals/builder/local.json` (ignorado por git) dice dónde están tus repos y cómo se llama cada cambio. Tiene `repos` (K, P1, P2, P3 → carpeta) y `tramos` (ID → `cambio` y `repo_codigo`). No se versiona: el repo es público (D-05).
- **Pruebas del banco.** `node --test tests/evals-builder/*.test.mjs` no llama a Codex ni a la red.

## 1. Calibrar el corpus

```sh
node evals/builder/bench.mjs calibrar --salida <carpeta>
```

Opciones: `--salida`/`--output`, `--tramos`/`--segments` (IDs separados por comas), `--local`. Escribe `<carpeta>/calibracion.json` con, por tramo, `valido` y `motivo`. Un tramo es válido si falla en la base, pasa con la referencia y `kit-check` no falla. Los motivos de descarte son `base-verde`, `referencia-roja`, `kit-check-falla`, `excluido` y `error-copia`, `error-preparacion`, `error-ejecucion`. Un tramo con `estado: "excluido"` en `evals/builder/corpus.json` no se ejecuta; hoy son K-03 y K-05 (D-36).

Avance en stderr: por tramo, una línea `[3/16] K-03` al empezar y `[3/16] K-03 válido` o `[3/16] K-03 descartado: referencia-roja` al terminar, también con error. Sin rutas ni salida cruda; los registros crudos van a `<carpeta>/logs`.

`calibrar` usa las pruebas de referencia visibles, como en la base (D-34). Solo `correr` las oculta (sección 2).

Recalibra cada vez que cambien el corpus, el código del banco o el kit: una calibración vieja no sirve para comparar. Usa una carpeta de salida nueva en cada corrida; `correr` reanuda sobre `resultados.jsonl`, y mezclar calibraciones deja pares de versiones distintas.

Pruebas citadas en la verificación: si la verificación del tramo cita un archivo de prueba que existe en la referencia, la copia lleva su versión de la referencia, aunque `HEAD` sea posterior. De `HEAD` solo se toma la prueba citada que no existe en la referencia (D-30).

Prueba de humo (un tramo, no es la línea base):

```sh
node evals/builder/bench.mjs correr --variante base --semilla 1 --tramos K-02,P1-03 --salida <carpeta-humo>
```

Debe salir con `contrato_ok` verdadero en cada línea de `resultados.jsonl`.

## 2. Correr una variante

```sh
node evals/builder/bench.mjs correr --variante base --semilla 1 --calibracion <carpeta>/calibracion.json --salida <carpeta-corrida>
```

- `--variante`/`--variant`: nombre de `evals/builder/variantes/` o una ruta a un `.json`. Es obligatorio.
- `--semilla`/`--seed`: obligatoria. Misma semilla, mismo orden de tramos.
- `--calibracion`: obligatoria sin `--tramos`. Sin al menos 10 tramos válidos no se lanza nada (D-27).
- `--repeticiones`/`--repeats` (1 por defecto), `--tramos`/`--segments`, `--tope-tokens`/`--token-cap` (corta al superar la suma de entrada y salida), `--salida`/`--output`, `--local`.

Las pruebas de referencia que el tramo nombra quedan ocultas al builder y entran en *Scope*, con el prefijo del repo hijo si lo hay (D-34, D-41). Al medir, `correr` las reescribe desde la referencia y la verificación da `oraculo_pasa` (sección 3). En las copias de los tramos K, el contrato de la variante reemplaza al del repo copiado (D-35).

Cada tramo corre en una copia desechable del kit con la variante aplicada. Al terminar se borran las copias de cada tramo, la copia del kit y el `HOME` temporal. Ese `HOME` solo tiene enlaces: `.agents/skills` a las skills de la copia y `.codex` a tu carpeta de Codex (`CODEX_HOME` o `~/.codex`); se quita el enlace, nunca la carpeta real. La corrida es reanudable: al repetirla, salta los pares DONE y PAUSED ya escritos y reintenta los de `entorno` e `invalida`. Un límite de uso no deja línea y el tramo se relanza al reanudar.

Avance en stderr: por cada par, `[k/N] K-03 r1` al empezar y el resultado al terminar (`[k/N] K-03 r1 DONE`, `PAUSED`, `invalida` o `entorno: <motivo>`). Al reanudar, los pares ya escritos salen como `[k/N] K-03 r1 saltado (ya terminado)`. Si hay un límite de uso, la última línea es `límite de uso; la corrida se detiene`.

Salida en `<carpeta-corrida>`:

- `corrida.json`: semilla, orden, repeticiones, hash del corpus, huellas (`kit`, `contrato`, `modelos`), modelos resueltos y versión de Codex.
- `resultados.jsonl`: una línea por tramo y repetición.
- `logs/<ID>-r<rep>-runs.jsonl` y `logs/<ID>-r<rep>-kit-run.log`: por cada par que lanza `kit run`, sus intentos (`runs.jsonl` de la copia) y la salida cruda de `kit run`, guardados antes de borrar la copia, también si `kit run` falla. No van en `resultados.jsonl`.

`--salida` debe ir fuera del repo: los registros en `logs/` traen salida cruda de los tramos, con rutas y texto de los proyectos.

Códigos: 0 terminó; 1 falta o no se lee la calibración o el mapa local; 2 argumentos o variante inválidos; 3 corte (contrato no leído, tope de tokens o límite de uso).

## 3. Métricas por tramo

Cada línea de `resultados.jsonl` trae:

| Campo | Qué mide |
|-------|----------|
| `resultado` | `DONE`, `PAUSED`, `entorno` (fallo de infraestructura o de preparación) o `invalida` (contaminación o contrato no leído). |
| `done_sin_intervencion` | Si el último intento de `kit run` terminó DONE. |
| `oraculo_pasa` | Si la verificación del tramo pasa con las pruebas de referencia reescritas: `true`, `false`, o `null` si no hubo intentos, si el hash de alguna prueba no coincide o si la verificación no pudo correr. No cambia `resultado` (D-37, D-40). |
| `relanzamientos`, `motivos` | Intentos menos uno, y el motivo de cada relanzamiento. |
| `muertes_proceso`, `muertes_thrashing` | Intentos con clase `infra` y con señal `thrashing`. |
| `thrashing_verificable` | Solo Claude Code tiene la firma de thrashing; con Codex es `false`. |
| `compactaciones`, `tokens`, `creditos` | Desde `scripts/usage.mjs`. `creditos` es null si una sesión no tiene tarifa. |
| `segundos` | Builder, verify y revisor: suma cada fase sobre los intentos donde se registró (`kit run` deja null la fase que no corre; un relanzamiento solo del revisor no tiene `builder`). `total` suma las fases registradas y es null solo si no hay ninguna. |
| `lineas` | Líneas de prueba sobre líneas de producto (`razon`). |
| `contaminado`, `contrato_ok` | Si aparecen rutas de la fuente en las sesiones; si la copia del contrato se leyó y la instalación viva no. |
| `referencia` | Archivos y líneas de la solución de referencia. |

Un dato que falta es `null`, nunca `0`.

## 4. Comparar dos corridas

```sh
node evals/builder/bench.mjs comparar <carpeta-base> <carpeta-variante>
node evals/builder/bench.mjs comparar <carpeta>
```

Con dos carpetas, compara par a par (tramo y repetición). Solo son comparables si tienen la misma semilla, orden, repeticiones, corpus, huella `kit` y versión de Codex; si no, sale con 2 y nombra lo que difiere. Las huellas `contrato` y `modelos` sí pueden diferir, porque es la variante, y `comparar` las informa en `difieren:`.

Excluye los pares `entorno`, `contaminado` e `invalida`, y los pares sin pareja (`sin-pareja`), y los lista con su lado (A, B o ambos). Informa:

- `n` y tasas: `done` (DONE) y `sin_intervencion` (DONE sin intervención).
- Medianas: `mediana_relanzamientos`, `mediana_segundos`, `mediana_tokens`, `mediana_creditos`, `mediana_compactaciones` y `mediana_razon_prueba_producto` (`lineas.razon`).
- Totales: `muertes_proceso` y `muertes_thrashing`. Si alguna línea no es de Claude Code, el total lleva `(no verificable)`.
- `oraculo_pasa`: tasa sobre los pares con dato (`con_dato`), y en el desglose por par, las columnas `oraculo_A` y `oraculo_B` (D-37, D-40).
- El desglose por tamaño de referencia: hasta 60, 61–150 y más de 150 líneas.

Un dato que falta se imprime como `-`. Con una sola carpeta resume esa corrida. La salida solo lleva IDs, números y motivos fijos.

## 5. Poner la variante B

`evals/builder/variantes/contrato-b.json` es el marcador para la variante que aporta la persona (D-01). Hoy trae las dos rutas en `null`, y `correr` lo rechaza con código 2.

Para usarla, pon sus dos archivos de contrato en una carpeta `contrato-b/` junto a `contrato-b.json` (`evals/builder/variantes/contrato-b/builder.md` y `evals/builder/variantes/contrato-b/SKILL.md`) y deja las rutas así:

```json
{
  "nombre": "contrato-b",
  "contrato": {
    "builder": "contrato-b/builder.md",
    "execute_plan": "contrato-b/SKILL.md"
  }
}
```

- `contrato` admite solo `builder` y `execute_plan`. Las rutas son relativas a la carpeta del archivo de la variante; no pueden ser absolutas ni tener `..`.
- Un contrato nulo, o con todos sus archivos iguales a la base, sale con 2 y no deja copia.
- También admite `nivel` (de `levels` en `models.json`), `esfuerzo` (de `efforts`) y `ventana` (entero positivo). Solo cambian la copia, nunca `models.json` del repo (D-06).

Después corre la base y la variante con la misma semilla, el mismo corpus y la misma calibración, y compáralas:

```sh
node evals/builder/bench.mjs correr --variante base --semilla 1 --calibracion <cal>/calibracion.json --salida <a>
node evals/builder/bench.mjs correr --variante contrato-b --semilla 1 --calibracion <cal>/calibracion.json --salida <b>
node evals/builder/bench.mjs comparar <a> <b>
```

## 6. Límites

- **Muestra pequeña.** Con 10 tramos y una repetición solo se detectan diferencias grandes. Para decidir un A/B conviene `--repeticiones 3`, que triplica el gasto.
- **Costo del revisor vacío.** `gpt-6.1-terra` no tiene tarifa en `scripts/rates.json`, así que su costo queda vacío y no se inventa. Si una sesión no tiene tarifa, los créditos de la corrida son `null`.
- **Thrashing.** La firma solo se verifica en Claude Code. Con Codex, `thrashing_verificable` es `false` y el conteo no es verificable.
- **Reservas con Docker.** Las seis reservas del corpus no están calibradas. P1-03, P1-05, P3-02 y P3-03 necesitan Docker o un workspace; P1-04 depende de una base de datos por confirmar; P3-01 necesita `verify` completo. P3 todavía no tiene ningún tramo calibrado. El detalle está en `changes/done/evals-builder/corpus.md`.
- **Calibración dentro de Codex.** `calibrar` no corre dentro del sandbox de Codex, así que aún pueden salir pares `entorno`. Con K-03 y K-05 excluidos (D-36), el corpus tiene 8 tramos calibrados, por debajo del mínimo de 10: `correr --calibracion` no arranca con este corpus, y la línea base usó 8 tramos con `--tramos` (D-27, D-42).
- **Línea base no válida.** La corrida del 2026-11-27 (8 tramos, Codex, semilla 1) no decide nada: su veredicto está en `changes/done/evals-builder/linea-base.md`. Gasto y duración para un A/B válido no están medidos.
- **Defectos conocidos del banco** (de esa línea base; D-43 deja rehacerlos para otro cambio):
  1. El plan reconstruido solo lleva el bloque del tramo: pierde las demás secciones del plan (12 a 15 por fuente) y los documentos del cambio que el tramo cita (1 a 8).
  2. Fija `repos: [.]` aunque la fuente tenga 2 o 3 repos.
  3. `calibrar` corre fuera del sandbox de Codex: no detecta tramos que necesitan Docker o puertos.
  4. En P1-02, 12 archivos de tramos previos no existen en la referencia; el efecto no está comprobado.
- **No cambia el kit.** Ninguna corrida modifica modelos, esfuerzo ni ventana del repo; la variante vive solo en su copia temporal.
