# task-02 — Evidencia mide tamaños, acepta «en curso» y la skill se corrige
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`validar-tarea.mjs --evidencia` no mide el tamaño de la tarea ni el de *Evidencia* (los topes de 8192 y 1536 caracteres solo están en prosa), rechaza el estado `en curso` (que es el estado del constructor cuando debe correrlo, paso 3 de `skills/ejecutar-tarea/SKILL.md`) y no usa la detección de bloques sin cerrar de task-01. Se corrige el validador y el paso 3 de la skill.

## Contexto
- Fuente: definitions/AUDITORIA.md «2.7 Documento de tarea dañado: quién repara»
- Tocar: `scripts/formato-evidencia.mjs`, `pruebas/comprobaciones/formato-evidencia.test.mjs`, `skills/ejecutar-tarea/SKILL.md`
- Requiere: runtime:node@25
- `scripts/formato-evidencia.mjs` líneas 4-11: constantes `ESTADOS_NO_TERMINADOS = ['borrador','aprobada','en curso']` y `ESTADOS_TERMINADOS`; en `validarEvidencia(texto)` el bloque `if (ESTADOS_NO_TERMINADOS.includes(estado))` devuelve «La tarea no está terminada».
- `scripts/formato-tarea.mjs` exporta `MAX_CARACTERES = 8192` y, desde task-01, `bloqueSinCerrar(lineas)` y `mensajeBloqueSinCerrar(lineas)` (texto del error o `null`).
- `skills/ejecutar-tarea/SKILL.md` mide 7366 bytes; tope 7623 (`pruebas/comprobaciones/topes-bytes.test.mjs`). Paso 3 de *Ejecución* (línea 24): manda correr `--evidencia` «antes de `lista para revisión`» pero el estado sigue `en curso` y hoy el validador lo rechaza.
- `coherenciaRegistro` ya salta la regla 1 cuando `estado` no es terminado (no se toca).

## Decisiones ya tomadas
- `validarEvidencia` rechaza solo `borrador` y `aprobada` con «La tarea no está terminada: estado «X».». Acepta `en curso` y `lista para revisión` (se valida igual que `lista para revisión`). `hecha`, `bloqueada` y `cancelada` conservan su comportamiento actual (inferido: «rechaza los demás» del alcance se limita a los estados de antes de construir).
- Medidas solo con estado `en curso` o `lista para revisión`: total de la tarea > 8192 caracteres → «La tarea mide N caracteres; el máximo es 8192.»; *Evidencia* (texto de la sección con `lineas.join('\n').trim()`) > 1536 caracteres → ««Evidencia» mide N caracteres; el máximo es 1536.». Límites inclusivos: 8192 y 1536 pasan; 8193 y 1537 no.
- Bloque sin cerrar: al inicio de `validarEvidencia`, si `mensajeBloqueSinCerrar(lineas)` no es `null`, se devuelve solo ese texto (el mismo de `validarTarea`).
- Skill, paso 3: queda así en esencia: se corre `--evidencia` con la tarea todavía en `en curso`; solo si sale 0 se cambia `estado` a `lista para revisión`. Sin crecer más de 257 bytes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: tamaños, estados y bloque sin cerrar en `--evidencia`; el paso 3 de la skill; pruebas.
Fuera de alcance: la firma, el hook, `agentes/*.md`, otros pasos de la skill y `formato-bloqueo.mjs`.

## Pasos
1. En `scripts/formato-evidencia.mjs`: `ESTADOS_NO_TERMINADOS` pasa a `['borrador','aprobada']`; al inicio de `validarEvidencia` aplica el bloque sin cerrar; con `en curso` o `lista para revisión` aplica las dos medidas.
2. En el test: `en curso` válido pasa; `aprobada` y `borrador` se rechazan; 1536 pasa y 1537 se rechaza; total 8192 pasa y 8193 se rechaza (rellena *Notas* para el total); el fixture del bloque «```sh» abierto en *Evidencia* da un error con `bloque de código abierto en línea` y sin «Falta la salida».
3. Edita el paso 3 de `skills/ejecutar-tarea/SKILL.md` con `Edit` según la decisión.
4. Corre `node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs`; si una prueba de contrato lee la frase vieja, ajústala en este mismo paso solo en esa frase.

## Criterios de aceptación
1. `en curso` con evidencia completa sale con `OK`; `aprobada` sale con «no está terminada». Se comprueba en `formato-evidencia.test.mjs`.
2. *Evidencia* de 1537 caracteres y total de 8193 se rechazan; 1536 y 8192 pasan. Misma prueba.
3. El fixture del bloque abierto da un error único con «bloque de código abierto en línea».
4. `skills/ejecutar-tarea/SKILL.md` mide ≤ 7623 bytes y su paso 3 dice que se corre `--evidencia` en `en curso` antes de pasar a `lista para revisión`.
5. `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/formato-evidencia.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
wc -c skills/ejecutar-tarea/SKILL.md
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; las pruebas con `fail 0`; `wc -c` imprime un número ≤ 7623; `rapida.sh` con `exit 0`.

## Evidencia
```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs
ℹ tests 73
ℹ pass 73
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 42
ℹ pass 42
ℹ fail 0
exit 0
$ wc -c skills/ejecutar-tarea/SKILL.md
7419 skills/ejecutar-tarea/SKILL.md
exit 0
$ bash pruebas/rapida.sh
ℹ tests 771
ℹ pass 771
ℹ fail 0
rapida: 53 archivos en 32 s (tope 90 s)
exit 0
```

## Notas
Sin huecos menores: se siguieron las *Decisiones ya tomadas* y el alcance. La prueba de 8193 caracteres rellena *Notas* con una línea antes de «Registro:» para llegar al total.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
