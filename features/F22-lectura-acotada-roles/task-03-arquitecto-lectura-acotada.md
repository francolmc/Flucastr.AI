# task-03 — `arquitecto` y `disenar-arquitectura`: cada definición una vez por sesión
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
`definitions/CONTEXTO.md` §2.2 fija que el `arquitecto` lee `PROJECT`, `REPOS` y `ARCHITECTURE` una vez por sesión (si necesita algo de nuevo, lee la sección con `offset`/`limit`) y que no lee `features/` ni tareas. Hoy `agentes/arquitecto.md` y `skills/disenar-arquitectura/SKILL.md` no dicen nada de lectura. Esta tarea agrega esa regla en ambos.

## Contexto
- Diseño aprobado: `definitions/CONTEXTO.md` §2.2 (fila `arquitecto`). Leer solo esa sección.
- `agentes/arquitecto.md` (3482 bytes): la sección `## Cómo trabajas` termina con el párrafo que empieza ``Produces `AGENTS.md` e `initialize.sh` …``; la siguiente es `## Antes de entregar`.
- `skills/disenar-arquitectura/SKILL.md` (2194 bytes): después de la línea ``Entradas: `definitions/PROJECT.md` y, si el proyecto existe, `definitions/REPOS.md`.`` viene `## Paso 1: elegir el modo`.
- Nada en `pruebas/` ni `scripts/` fija esas líneas (comprobado con `grep -rn`). Deben seguir pasando: `pruebas/comprobaciones/contrato-roles.test.mjs` e `higiene-contexto.test.mjs`.
- Tocar: `agentes/arquitecto.md`, `skills/disenar-arquitectura/SKILL.md`.

## Decisiones ya tomadas
- Cada reemplazo es un solo `Edit` con el texto exacto de abajo; cada frase va en su propia línea (la verificación cuenta con `grep -cF`).
- `agentes/arquitecto.md`: sección nueva `## Lectura acotada` entre «Cómo trabajas» y «Antes de entregar», con estas viñetas literales:
  - ``- Lees `PROJECT.md`, `REPOS.md` y `ARCHITECTURE.md` una vez por sesión.``
  - ``- Si necesitas algo de nuevo, lee solo esa sección con `Read` y `offset`/`limit`; ubícala con `grep -n '^## '`.``
  - ``- No lees `features/` ni tareas.``
- `disenar-arquitectura`: después de la línea de «Entradas:» se agrega la línea ``Lee cada entrada una vez; si necesitas algo de nuevo, lee solo esa sección con `offset` y `limit`.``
- Topes finales: `agentes/arquitecto.md` ≤ 4100 bytes; la skill ≤ 2500 bytes.

## Alcance / Fuera de alcance
Alcance: los dos archivos, solo los pasajes indicados.
Fuera de alcance: `planificador`, `constructor`, `coordinador` y las demás skills; pruebas de contrato (task-04); `definitions/`; correr modelo.

## Pasos
1. `agentes/arquitecto.md`: `Edit` que inserta «## Lectura acotada» antes de «## Antes de entregar».
2. `skills/disenar-arquitectura/SKILL.md`: `Edit` que agrega la línea después de «Entradas:».
3. Correr la *Verificación* y pegar la cola relevante en *Evidencia*.

## Criterios de aceptación
1. Las tres viñetas aparecen cada una en exactamente una línea de `agentes/arquitecto.md`.
2. La skill contiene `Lee cada entrada una vez` en exactamente una línea.
3. `agentes/arquitecto.md` ≤ 4100 bytes y la skill ≤ 2500 bytes.
4. Las suites de contrato y de higiene siguen en `fail 0`.
5. `bash pruebas/rapida.sh` termina con código 0 y S ≤ 30.

## Verificación
- `cd /Users/franco/Codes/flucastr/Flucastr.AI && for f in 'Lees `PROJECT.md`, `REPOS.md` y `ARCHITECTURE.md` una vez por sesión' 'lee solo esa sección con `Read` y `offset`/`limit`' 'No lees `features/` ni tareas'; do grep -cF -- "$f" agentes/arquitecto.md; done` → `1` tres veces.
- `grep -cF 'Lee cada entrada una vez' skills/disenar-arquitectura/SKILL.md` → `1`; `wc -c agentes/arquitecto.md skills/disenar-arquitectura/SKILL.md` → ≤ 4100 y ≤ 2500.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30 (si pasa de 30 s sin prueba fallida, repetirla una vez y anotarlo en *Notas*).

## Evidencia

Comando: `for f in ...; do grep -cF -- "$f" agentes/arquitecto.md; done`
Salida: `1` `1` `1`

Comando: `grep -cF 'Lee cada entrada una vez' skills/disenar-arquitectura/SKILL.md`
Salida: `1`

Comando: `wc -c agentes/arquitecto.md skills/disenar-arquitectura/SKILL.md`
Salida:
```
    3723 agentes/arquitecto.md
    2294 skills/disenar-arquitectura/SKILL.md
    6017 total
```
(3723 ≤ 4100; 2294 ≤ 2500)

Comando: `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs`
Salida (cola):
```
ℹ tests 46
ℹ pass 46
ℹ fail 0
ℹ duration_ms 71.199
```

Comando: `bash pruebas/rapida.sh`
Salida (cola):
```
ℹ tests 335
ℹ pass 335
ℹ fail 0
rapida: 29 archivos en 22 s (tope 30 s)
```
Código de salida: 0; S = 22 ≤ 30.

Criterios: 1 cumplido (tres viñetas, una línea cada una); 2 cumplido; 3 cumplido; 4 cumplido (contrato y higiene, `fail 0`); 5 cumplido (código 0, S = 22).

## Notas

- Decisión: los reemplazos se hicieron con un `Edit` por archivo, con el texto literal de la tarea. Sin huecos menores.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
