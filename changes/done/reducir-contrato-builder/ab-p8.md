# A/B para P8: contrato anterior frente a contrato nuevo (preparado, **sin ejecutar**)

## Pregunta
¿El contrato nuevo reduce las líneas de prueba sin empeorar el cumplimiento de la aceptación ni la seguridad?

## Variantes
- **A:** kit en `0693be5` (`main` antes del cambio).
- **B:** kit en el commit liberado de este cambio.

Misma herramienta (`kit run`, solo Codex), mismo modelo y esfuerzo. En A `kit run` no entrega `builder.md`; esa diferencia es parte de lo medido.

## Planes

| # | Plan (`changes/done/…`) | Commit base | Tramos | Producto original (+/-) | Prueba original | Razón |
|---|---|---|---|---|---|---|
| 1 | `una-espera-write-stdin` | `1280346` | 2 | 49 | 35 | 0,71 |
| 2 | `tramos-verificables` | `5112e59` | 1 | 68 | 74 | 1,09 |
| 3 | `kit-run-pegado` | `644cf38` | 3 | 300 | 262 | 0,87 |
| 4 | `proceso-rapido` | `0d1d177` | 2 | 235 | 271 | 1,15 |
| 5 | `higiene-verify` | `0a3895c` | 4 | 153 | 638 | 4,17 |

## Preparación (por plan y variante; la hace la persona usuaria)
1. Clon desechable en el commit base, uno por corrida.
2. Copiar la carpeta del plan desde `main`; vaciar *Evidence* y *Notes*, desmarcar casillas, `status: approved`, `segment: 1`. Misma copia para A y B.
3. Dejar el kit y las skills instaladas en la variante; comprobar con `wc -c` los dos archivos del contrato antes de lanzar.
4. Alternar el orden (1A, 1B, 2B, 2A, …) para repartir efectos del entorno.
5. Lanzar los tramos en orden; cortar el plan ante el primer `PAUSED` y registrarlo.

## Medidas (con las herramientas de la variante B para ambas)

| Medida | Cómo |
|---|---|
| Líneas de prueba, de producto y razón | clasificación de `medir-razon.mjs` sobre el diff contra la base |
| Aceptación | `kit-check <plan>` |
| Alcance | `kit-scope <plan>` |
| `verify` final | exit code; fallos conocidos de la base, anotados antes |
| Pruebas sobre montajes sintéticos | revisión ciega del diff, sin saber la variante |
| Retornos | `DONE`, `PAUSED` y motivo, relanzamientos (`runs.jsonl`) |
| Costo | `scripts/usage.mjs` y duración |

## Criterio (fijado antes de correr)
B se acepta si: (1) ningún A# que A cumple falla en B; (2) cero violaciones de seguridad o alcance nuevas; (3) la mediana de líneas de prueba baja respecto de A; (4) los `PAUSED` no aumentan en más de 1.

## Límites
Cinco planes y una corrida por celda no dan significancia: sirve para detectar regresiones gruesas. Los planes ya resueltos citan rutas de su época; si una base no pasa `verify` antes de empezar, se anota y se compara contra esa línea base.
