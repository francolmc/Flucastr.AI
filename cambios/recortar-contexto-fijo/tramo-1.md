# Tramo 1: menos llamadas y relecturas + alerta de 5 horas
Resultado: principal y constructor agrupan lecturas independientes y leen cada archivo una vez; el medidor avisa de la ventana de 5 horas. Toca `agentes/principal.md`, `skills/ejecutar-plan/SKILL.md`, `scripts/uso.mjs`, `pruebas/uso/`.

## Pasos
- [ ] Medir y anotar en *Evidencia* los tamaños de partida de los cinco archivos con `wc -c` (A3)
- [ ] En `principal.md` agregar la sección «Lectura» de ≤ 5 líneas: lecturas independientes en una sola llamada (varios comandos en un mismo paso, sin nombrar la herramienta); cada archivo y cada skill una vez por sesión; tras compactar no releer lo ya resumido; `rg` y `sed -n` en vez de `cat` de archivos grandes (A1)
- [ ] En `ejecutar-plan` agregar al bucle una línea equivalente: agrupar en una sola llamada las lecturas independientes (A1)
- [ ] Escribir ambas reglas neutras: «en una sola llamada» sin nombrar herramientas, con una frase de cómo hacerlo en cada soporte solo si hace falta (A1, A7)
- [ ] Revisar que el texto de ambos use la frase exacta «una sola llamada» (A1)
- [ ] En `uso.mjs` leer `rate_limits.primary.used_percent` del último evento y avisar «Ventana de 5 horas de Codex en N %» si es ≥ `--umbral` (A2)
- [ ] Dos fixtures (85 y 40 en `primary`) y su prueba en `probar.mjs`, más el caso sin dato (A2)
- [ ] En un HOME temporal, `bash instalar.sh` y `grep -c "una sola llamada"` en el principal generado de Claude Code, Pi y Codex (A7)

Verificación del tramo: `node pruebas/uso/probar.mjs && ./verify` (A1, A2, A4, A7).

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
