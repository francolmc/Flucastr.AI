# F42 — Topes de acotación de la tarea (decisión del arquitecto)

Estado: decisiones 1–3 de Franco (2026-11-05) aplicadas; §4 ya está en `WORKFLOW.md` §6. Fecha: 2026-11-05. Puerta 1 de F42.

## 1. Origen (qué es confirmado y qué inferido)

- Confirmado (leído): `WORKFLOW.md` §6 dice «~8 pasos y ~3 archivos tocados, hasta 5 criterios; 6 KB (aviso) / 8 KB (error)». `skills/descomponer-feature/SKILL.md` línea 63 repite «~8 pasos, ~3 archivos tocados y 5 criterios»; línea 64 repite 6/8 KB.
- Confirmado: `scripts/formato-tarea.mjs` hace error si pasos <1 o >8 (línea 170) y si la tarea supera 8192 caracteres (línea 187). El aviso de 6 KB hoy solo existe como informe en `scripts/archivar.mjs` (`UMBRALES.TAREA: 6144`), no en el validador.
- Confirmado: topes de bytes `agentes/planificador.md` 3576/3584 y `skills/descomponer-feature/SKILL.md` 6363/6400 (BACKLOG, F42).
- Inferido: las cifras ≤4 / ≤3 / ≤12 KB / ≤6 vienen de F42 como punto de partida; se calibran con tareas reales.

## 2. Decisiones

**(a) Los topes viven en `WORKFLOW.md` §6 y reemplazan «~8 pasos, ~3 archivos».** Porque §6 ya es la fuente de las cifras de acotación y los demás archivos (skill, validador) deben apuntar a una sola. Se quita el «~»: los topes pasan a ser medibles y exactos. Alternativa descartada: ponerlos en la skill (sin bytes libres, y duplicaría §6). Cambiaría si las cifras se calibran distinto: se edita solo §6 y la constante del script.

**(b) El aviso sale antes del error solo donde la medida es continua.**
- Contexto en bytes (suma de los archivos de `Leer:`, con `offset`/`limit` contado por el tramo): aviso desde 9 KB, error sobre 12 KB (75 % / 100 %, un margen parecido al 6/8 KB).
- Archivos a leer (≤4), archivos a tocar (≤3), pasos (≤6): error directo. Son enteros chicos; un aviso a 3 / 2 / 5 sería ruido y empujaría a atomizar, que el pedido de Franco descarta.
- Tamaño de la tarea: se mantiene 6 KB aviso / 8 KB error, sin cambio (fuera de alcance de F42). El aviso de 6 KB sigue siendo informe de `archivar.mjs`; el nuevo aviso de 9 KB sale en `validar-tarea.mjs` (exit 0, mensaje que nombra el tope y la cifra medida).
- Un solo objetivo verificable no se puede medir por script: queda como regla en §6 y como revisión de Franco en la puerta 3.

**(c) Las reglas no van en agentes/planificador.md ni en la skill: van en `scripts/`, con un cambio neutro en bytes.**
- Implementación: nuevas constantes y chequeos en `scripts/formato-tarea.mjs` (que `validar-tarea.mjs` ya reutiliza). El mensaje de error es el que enseña la regla al planificador, así que no hace falta texto en el prompt.
- `SKILL.md` línea 63: reemplazar «Hasta ~8 pasos, ~3 archivos tocados y 5 criterios de aceptación.» por «Topes: `WORKFLOW.md` §6; los mide el validador.» (acorta, no crece). Línea 64 sin cambio.
- `agentes/planificador.md`: sin cambios.
- Skill nueva: descartada. Cargarla cuesta contexto en cada descomposición y el validador ya corta el caso malo; solo se reconsidera si el modelo real del planificador (corrida Claude Code y Pi, patrón F36) no respeta los topes pese al mensaje.

Efecto colateral: la regla 6 de `formato-tarea.mjs` pasa de 1–8 a 1–6 pasos. Las tareas de `features/completed/` no se revalidan (F42, aceptación). Tareas con 7 u 8 pasos que NO estén `hecha` fallarían: la descomposición de F42 las lista y se rehacen. Las `hecha` quedan exentas (no se revalidan), igual que `features/completed/`.

## 3. Cómo se mide «contexto» (para que la tarea sea verificable)

- Línea `Leer:` en *Contexto*: una ruta por archivo, opcionalmente `ruta@offset-limit`.
- Bytes = tamaño en disco del archivo (o de las `limit` líneas si hay rango). Si el archivo no existe, error de formato, no de tope.
- Lo declarado es lo medido: el validador no adivina lecturas que la tarea no lista.

## 4. Texto propuesto para pegar en `WORKFLOW.md` §6

Reemplaza las dos viñetas «Hasta ~8 pasos…» y «Hasta 6 KB…» de «Qué las hace acotadas»:

```
- Topes por tarea (los mide `scripts/validar-tarea.mjs`; error si se superan):
  archivos a leer ≤4 (línea `Leer:` en *Contexto*), archivos a tocar ≤3,
  pasos ≤6, criterios de aceptación ≤5, contexto a leer ≤12 KB (suma de
  los archivos de `Leer:`; a uno grande se le fija `offset`/`limit`),
  y un solo objetivo verificable (lo revisa Franco en la puerta 3).
  Aviso (no bloquea) con contexto >9 KB.
- La tarea mide hasta 6 KB (aviso) / 8 KB (error); *Evidencia* hasta 1,5 KB.
- Sobre un tope, el planificador la parte con `depende_de:`; cada parte debe
  seguir siendo útil por sí sola (no se parte para llegar a un paso por tarea).
```

Y en la viñeta existente «Si no cabe…» basta con borrarla (queda cubierta por la última viñeta).

## Decisiones de Franco (2026-11-05)

1. Aviso de contexto desde 9 KB, error sobre 12 KB.
2. Conteos (4 / 3 / 6): error directo, sin aviso previo.
3. Tareas con 7–8 pasos: se listan y rehacen solo si NO están `hecha`; las `hecha` quedan exentas y no se revalidan.
