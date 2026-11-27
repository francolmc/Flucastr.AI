# Línea base del 2026-11-27

**Veredicto: no sirve para decidir un A/B.** 0 DONE de 6 pares medidos, y al menos 4 de los 8 pares se detuvieron por el banco o el entorno, no por el builder.

Corrida: variante `base`, semilla 1, 1 repetición, 8 tramos por `--tramos` (D-42), Codex (codex-cli 0.172.0, builder `gpt-6-luna`, revisor `gpt-6.1-terra`). Salida cruda fuera del repo.

## Resumen de `comparar`
| Métrica | Valor |
|---------|-------|
| Pares incluidos / excluidos | 6 / 2 (`entorno`) |
| DONE y DONE sin intervención | 0 y 0 |
| `oraculo_pasa` | 0 de 6 |
| Mediana de relanzamientos | 1 |
| Mediana de segundos | 481.7 |
| Mediana de tokens (entrada más salida) | 140925.5 |
| Mediana de créditos | 0.6498 (solo pares con todas sus sesiones con tarifa) |
| Compactaciones (mediana) | 0 |
| Muertes de proceso / thrashing | 0 / 0 (thrashing no verificable en Codex) |
| Mediana de razón prueba/producto | 0.566 |

## Por par
| Par | Resultado | Relanz. | Segundos | Prueba/producto | Detenido por | Lectura |
|-----|-----------|---------|----------|-----------------|--------------|---------|
| K-02 | PAUSED | 1 | 434 | 50/62 | puerta, luego revisor | medición válida |
| K-04 | PAUSED | 1 | 678 | 42/129 | revisor, dos veces | medición válida |
| P1-01 | PAUSED | 1 | 529 | 38/144 | puerta, dos veces (casillas sin evidencia) | sin separar |
| P2-02 | PAUSED | 1 | 534 | 120/95 | puerta, dos veces (casillas sin evidencia) | sin separar |
| P2-01 | PAUSED | 0 | 91 | 0/0 | builder: ambiguo (faltan textos citados) | banco |
| P2-03 | PAUSED | 0 | 122 | 0/0 | builder: ambiguo (falta una dependencia) | banco, probable |
| P1-02 | entorno | 0 | 86 | 0/0 | builder: un repo no figura en `repos:` | banco |
| P1-04 | entorno | 0 | 360 | 145/64 | EPERM al abrir un puerto local | sandbox de Codex |

## Defectos del banco que quedan
1. El plan reconstruido solo lleva el bloque del tramo: pierde las demás secciones del plan (12 a 15 por fuente) y los documentos del cambio que el tramo cita (1 a 8).
2. Fija `repos: [.]` aunque la fuente tenga 2 o 3 repos.
3. `calibrar` corre fuera del sandbox de Codex: no detecta tramos que necesitan Docker o puertos.
4. En P1-02, 12 archivos de tramos previos no existen en la referencia; efecto sin comprobar.
